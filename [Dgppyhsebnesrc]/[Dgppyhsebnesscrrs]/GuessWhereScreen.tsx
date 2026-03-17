import Layout from '../Dgppyhuseboncmpnts/Layout';
import { useNavigation } from '@react-navigation/native';

import AnimatedPressable from '../Dgppyhuseboncmpnts/AnimatedPressable';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Alert,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: puppBonW, height: puppBonH } = Dimensions.get('window');
const puppBonIsLandscape = puppBonW > puppBonH;
const puppBonS = puppBonIsLandscape
  ? puppBonW / 844
  : Math.min(puppBonW / 390, puppBonH / 844);

const puppBonStorageSkinsOwned = 'SKINS_OWNED';
const puppBonStorageGuessNextAt = 'GUESS_NEXT_AT';
const puppBonStorageGuessAttemptsLeft = 'GUESS_ATTEMPTS_LEFT';
const puppBonStorageGuessActiveDog = 'GUESS_ACTIVE_DOG';
const puppBonStorageGuessCorrectIndex = 'GUESS_CORRECT_INDEX';
const puppBonStorageGuessPendingResult = 'GUESS_PENDING_RESULT';

type DogId = 'dog-1' | 'dog-2' | 'dog-3' | 'dog-4';
type SkinId = 'base' | 'alt';
type OwnedSkinsMap = Record<DogId, SkinId[]>;
type GuessResult = 'playing' | 'lose' | 'win';

const puppBonDayMs = 24 * 60 * 60 * 1000;
const puppBonGrid = 9;

const puppBonDogIds: DogId[] = ['dog-1', 'dog-2', 'dog-3', 'dog-4'];

const puppBonClamp0 = (n: number) => (Number.isFinite(n) ? n : 0);
const puppBonNow = () => Date.now();
const puppBonPad2 = (n: number) => String(n).padStart(2, '0');
const puppBonGetRandInt = (max: number) => Math.floor(Math.random() * max);

const puppBonFormatLeft = (ms: number) => {
  const puppBonT = Math.max(0, ms);
  const puppBonHh = Math.floor(puppBonT / 3600000);
  const puppBonMm = Math.floor((puppBonT % 3600000) / 60000);
  const puppBonSs = Math.floor((puppBonT % 60000) / 1000);
  return `${puppBonPad2(puppBonHh)}:${puppBonPad2(puppBonMm)}:${puppBonPad2(
    puppBonSs,
  )}`;
};

const puppBonEnsureOwned = (v: string | null): OwnedSkinsMap => {
  const puppBonBase: OwnedSkinsMap = {
    'dog-1': ['base'],
    'dog-2': ['base'],
    'dog-3': ['base'],
    'dog-4': ['base'],
  };

  try {
    const puppBonParsed = v ? JSON.parse(v) : null;
    if (puppBonParsed && typeof puppBonParsed === 'object') {
      (Object.keys(puppBonBase) as DogId[]).forEach(id => {
        const puppBonArr = (puppBonParsed as any)[id];
        if (Array.isArray(puppBonArr) && puppBonArr.length) {
          puppBonBase[id] = puppBonArr as SkinId[];
        }
      });
    }
  } catch {}

  return puppBonBase;
};

const GuessWhereScreen: React.FC = () => {
  const puppBonNavigation = useNavigation<any>();

  const [puppBonOwned, setPuppBonOwned] = useState<OwnedSkinsMap>({
    'dog-1': ['base'],
    'dog-2': ['base'],
    'dog-3': ['base'],
    'dog-4': ['base'],
  });

  const [puppBonAttemptsLeft, setPuppBonAttemptsLeft] = useState(2);
  const [puppBonNextAt, setPuppBonNextAt] = useState<number>(0);
  const [puppBonCorrectIndex, setPuppBonCorrectIndex] = useState<number | null>(
    null,
  );
  const [puppBonActiveGuessDog, setPuppBonActiveGuessDog] =
    useState<DogId>('dog-1');
  const [puppBonGuessResult, setPuppBonGuessResult] =
    useState<GuessResult>('playing');
  const [puppBonTick, setPuppBonTick] = useState(0);
  const [puppBonShakeCellIndex, setPuppBonShakeCellIndex] = useState<
    number | null
  >(null);
  const puppBonShakeX = useRef(new Animated.Value(0)).current;

  const puppBonRunCellShake = useCallback(
    (idx: number) => {
      setPuppBonShakeCellIndex(idx);
      puppBonShakeX.setValue(0);

      Animated.sequence([
        Animated.timing(puppBonShakeX, {
          toValue: -10 * puppBonS,
          duration: 40,
          useNativeDriver: true,
        }),
        Animated.timing(puppBonShakeX, {
          toValue: 10 * puppBonS,
          duration: 40,
          useNativeDriver: true,
        }),
        Animated.timing(puppBonShakeX, {
          toValue: -6 * puppBonS,
          duration: 40,
          useNativeDriver: true,
        }),
        Animated.timing(puppBonShakeX, {
          toValue: 6 * puppBonS,
          duration: 40,
          useNativeDriver: true,
        }),
        Animated.timing(puppBonShakeX, {
          toValue: 0,
          duration: 30,
          useNativeDriver: true,
        }),
      ]).start(() => setPuppBonShakeCellIndex(null));
    },
    [puppBonShakeX],
  );

  const puppBonCanPlay = useMemo(
    () => puppBonNow() >= puppBonNextAt,
    [puppBonNextAt],
  );

  const puppBonTimeLeft = useMemo(
    () => Math.max(0, puppBonNextAt - puppBonNow()),
    [puppBonNextAt, puppBonTick],
  );

  useEffect(() => {
    (async () => {
      try {
        const [
          puppBonO,
          puppBonNa,
          puppBonAl,
          puppBonGd,
          puppBonCi,
          puppBonPending,
        ] = await Promise.all([
          AsyncStorage.getItem(puppBonStorageSkinsOwned),
          AsyncStorage.getItem(puppBonStorageGuessNextAt),
          AsyncStorage.getItem(puppBonStorageGuessAttemptsLeft),
          AsyncStorage.getItem(puppBonStorageGuessActiveDog),
          AsyncStorage.getItem(puppBonStorageGuessCorrectIndex),
          AsyncStorage.getItem(puppBonStorageGuessPendingResult),
        ]);

        const puppBonOwnedMap = puppBonEnsureOwned(puppBonO);
        setPuppBonOwned(puppBonOwnedMap);

        if (!puppBonO) {
          await AsyncStorage.setItem(
            puppBonStorageSkinsOwned,
            JSON.stringify(puppBonOwnedMap),
          );
        }

        const puppBonNext = puppBonNa ? puppBonClamp0(Number(puppBonNa)) : 0;
        setPuppBonNextAt(puppBonNext);

        const puppBonCooldownOver = puppBonNow() >= puppBonNext;

        if (puppBonCooldownOver) {
          const puppBonPickDog =
            puppBonDogIds[puppBonGetRandInt(puppBonDogIds.length)];

          setPuppBonGuessResult('playing');
          setPuppBonAttemptsLeft(2);
          setPuppBonCorrectIndex(null);
          setPuppBonActiveGuessDog(puppBonPickDog);

          await Promise.all([
            AsyncStorage.setItem(puppBonStorageGuessAttemptsLeft, '2'),
            AsyncStorage.setItem(puppBonStorageGuessActiveDog, puppBonPickDog),
            AsyncStorage.removeItem(puppBonStorageGuessCorrectIndex),
            AsyncStorage.removeItem(puppBonStorageGuessPendingResult),
          ]);
        } else {
          setPuppBonAttemptsLeft(
            puppBonAl ? puppBonClamp0(Number(puppBonAl)) : 2,
          );
          setPuppBonActiveGuessDog(((puppBonGd as DogId) || 'dog-1') as DogId);
          setPuppBonCorrectIndex(
            puppBonCi != null ? puppBonClamp0(Number(puppBonCi)) : null,
          );

          if (puppBonPending === 'lose') {
            setPuppBonGuessResult('lose');
            AsyncStorage.removeItem(puppBonStorageGuessPendingResult);
          } else if (puppBonPending === 'win') {
            setPuppBonGuessResult('win');
            AsyncStorage.removeItem(puppBonStorageGuessPendingResult);
          } else {
            setPuppBonGuessResult('playing');
          }
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const puppBonId = setInterval(() => setPuppBonTick(t => t + 1), 1000);
    return () => clearInterval(puppBonId);
  }, []);

  const puppBonStartNewRoundIfNeeded = useCallback(async () => {
    if (puppBonCorrectIndex != null) return;

    const puppBonIdx = puppBonGetRandInt(puppBonGrid);
    setPuppBonCorrectIndex(puppBonIdx);
    await AsyncStorage.setItem(
      puppBonStorageGuessCorrectIndex,
      String(puppBonIdx),
    );
  }, [puppBonCorrectIndex]);

  const puppBonLockFor24h = useCallback(async () => {
    const puppBonNext = puppBonNow() + puppBonDayMs;
    setPuppBonNextAt(puppBonNext);
    await AsyncStorage.setItem(puppBonStorageGuessNextAt, String(puppBonNext));
  }, []);

  const puppBonShareEmptyResult = () => {
    Share.share({
      message: `No luck this time. It's empty here...
We are sure that next time you will definitely be lucky!`,
    });
  };

  const puppBonOnPickCell = useCallback(
    async (idx: number) => {
      if (!puppBonCanPlay) return;

      await puppBonStartNewRoundIfNeeded();

      const puppBonCurrentCorrect =
        puppBonCorrectIndex != null
          ? puppBonCorrectIndex
          : Number(await AsyncStorage.getItem(puppBonStorageGuessCorrectIndex));

      const puppBonIsWin = idx === puppBonCurrentCorrect;

      if (puppBonIsWin) {
        const puppBonAlready = puppBonOwned[puppBonActiveGuessDog] || ['base'];
        const puppBonHasAlt = puppBonAlready.includes('alt');

        const puppBonNextOwned: OwnedSkinsMap = {
          ...puppBonOwned,
          [puppBonActiveGuessDog]: puppBonHasAlt
            ? puppBonAlready
            : (Array.from(new Set([...puppBonAlready, 'alt'])) as SkinId[]),
        };

        setPuppBonOwned(puppBonNextOwned);
        await AsyncStorage.setItem(
          puppBonStorageSkinsOwned,
          JSON.stringify(puppBonNextOwned),
        );
        await puppBonLockFor24h();
        await AsyncStorage.setItem(puppBonStorageGuessAttemptsLeft, '0');
        await AsyncStorage.setItem(puppBonStorageGuessPendingResult, 'win');

        setPuppBonAttemptsLeft(0);
        setPuppBonGuessResult('win');

        Alert.alert('Congratulations!', 'You received a new skin!', [
          {
            text: 'OK',
            onPress: () => puppBonNavigation.navigate('SkinsScreen'),
          },
        ]);
        return;
      }

      puppBonRunCellShake(idx);

      const puppBonNextAtt = Math.max(0, puppBonAttemptsLeft - 1);
      setPuppBonAttemptsLeft(puppBonNextAtt);
      await AsyncStorage.setItem(
        puppBonStorageGuessAttemptsLeft,
        String(puppBonNextAtt),
      );

      if (puppBonNextAtt <= 0) {
        await puppBonLockFor24h();
        await AsyncStorage.setItem(puppBonStorageGuessPendingResult, 'lose');
        setPuppBonGuessResult('lose');
      }
    },
    [
      puppBonActiveGuessDog,
      puppBonAttemptsLeft,
      puppBonCanPlay,
      puppBonCorrectIndex,
      puppBonLockFor24h,
      puppBonNavigation,
      puppBonOwned,
      puppBonRunCellShake,
      puppBonStartNewRoundIfNeeded,
    ],
  );

  return (
    <Layout>
      <View style={puppBonStyles.puppBonScreenPad}>
        <ImageBackground
          source={require('../assets/images/smallHead.png')}
          style={puppBonStyles.puppBonHeader}
          resizeMode="stretch"
        >
          <Text style={puppBonStyles.puppBonHeaderText}>Guess where</Text>
        </ImageBackground>

        {puppBonGuessResult === 'lose' ? (
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Image
              source={require('../assets/images/nodogsframe.png')}
              style={puppBonStyles.puppBonLoseImage}
              resizeMode="contain"
            />
            <ImageBackground
              source={require('../assets/images/textboard.png')}
              style={puppBonStyles.puppBonLoseTextBoard}
              resizeMode="stretch"
            >
              <View style={puppBonStyles.puppBonLoseTextInner}>
                <Text style={puppBonStyles.puppBonLoseTitle}>
                  It's empty here...
                </Text>
                <Text style={puppBonStyles.puppBonLoseBody}>
                  We are sure that next time{'\n'}you will definitely be lucky!
                </Text>
              </View>
            </ImageBackground>
            <AnimatedPressable
              activeOpacity={0.85}
              onPress={puppBonShareEmptyResult}
            >
              <ImageBackground
                source={require('../assets/images/mainbutton.png')}
                style={puppBonStyles.puppBonShareBtn}
                resizeMode="stretch"
              >
                <Text style={puppBonStyles.puppBonShareText}>Share</Text>
              </ImageBackground>
            </AnimatedPressable>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {puppBonCanPlay ? (
              <ImageBackground
                source={require('../assets/images/scoreboard.png')}
                style={puppBonStyles.puppBonAttemptsBoard}
                resizeMode="stretch"
              >
                <Text style={puppBonStyles.puppBonAttemptsText}>
                  You have {puppBonAttemptsLeft}/2 attempts.
                </Text>
              </ImageBackground>
            ) : (
              <ImageBackground
                source={require('../assets/images/scoreboard.png')}
                style={puppBonStyles.puppBonTimeBoard}
                resizeMode="stretch"
              >
                <Text
                  style={[puppBonStyles.puppBonAttemptsText, { fontSize: 24 }]}
                >
                  {puppBonFormatLeft(puppBonTimeLeft)}
                </Text>
              </ImageBackground>
            )}

            {puppBonCanPlay && (
              <View style={puppBonStyles.puppBonGrid}>
                {Array.from({ length: puppBonGrid }).map((_, idx) => (
                  <Animated.View
                    key={idx}
                    style={[
                      puppBonStyles.puppBonCell,
                      puppBonShakeCellIndex === idx && {
                        transform: [{ translateX: puppBonShakeX }],
                      },
                    ]}
                  >
                    <AnimatedPressable
                      activeOpacity={0.9}
                      onPress={() => puppBonOnPickCell(idx)}
                      disabled={!puppBonCanPlay || puppBonAttemptsLeft <= 0}
                      style={StyleSheet.absoluteFill}
                    >
                      <ImageBackground
                        source={require('../assets/images/unlockedBg.png')}
                        style={puppBonStyles.puppBonCellBg}
                        resizeMode="stretch"
                      />
                    </AnimatedPressable>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </Layout>
  );
};

const puppBonStyles = StyleSheet.create({
  puppBonScreenPad: {
    flex: 1,
    paddingTop: 50 * puppBonS,
    paddingBottom: 120,
    paddingHorizontal: 18 * puppBonS,
  },
  puppBonHeader: {
    alignSelf: 'center',
    width: 284 * puppBonS,
    height: 102 * puppBonS,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  puppBonHeaderText: {
    fontSize: 26 * puppBonS,
    color: '#1b0d05',
    fontFamily: 'Kanit-SemiBold',
    marginTop: -11 * puppBonS,
  },
  puppBonAttemptsBoard: {
    alignSelf: 'center',
    marginTop: 16 * puppBonS,
    width: 300 * puppBonS,
    height: 64 * puppBonS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  puppBonTimeBoard: {
    width: 237 * puppBonS,
    height: 86 * puppBonS,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 130 * puppBonS,
  },
  puppBonAttemptsText: {
    color: '#fff',
    fontFamily: 'Kanit-SemiBold',
    fontSize: 16 * puppBonS,
  },
  puppBonGrid: {
    alignSelf: 'center',
    marginTop: 35 * puppBonS,
    width: 340 * puppBonS,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8 * puppBonS,
    marginBottom: 30 * puppBonS,
  },
  puppBonCell: {
    width: 100 * puppBonS,
    height: 100 * puppBonS,
  },
  puppBonCellBg: {
    width: '100%',
    height: '100%',
  },
  puppBonLoseImage: {
    width: 280 * puppBonS,
    height: 160 * puppBonS,
    marginTop: 30 * puppBonS,
  },
  puppBonLoseTextBoard: {
    width: 300 * puppBonS,
    height: 140 * puppBonS,
    marginTop: 48 * puppBonS,
  },
  puppBonLoseTextInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14 * puppBonS,
  },
  puppBonLoseTitle: {
    color: '#fff',
    fontFamily: 'Kanit-SemiBold',
    fontSize: 22 * puppBonS,
  },
  puppBonLoseBody: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Kanit-SemiBold',
    fontSize: 13 * puppBonS,
    marginTop: 10 * puppBonS,
    textAlign: 'center',
  },
  puppBonShareBtn: {
    width: 220 * puppBonS,
    height: 70 * puppBonS,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 54 * puppBonS,
  },
  puppBonShareText: {
    color: '#fff',
    fontFamily: 'Kanit-SemiBold',
    fontSize: 22 * puppBonS,
    marginTop: -2 * puppBonS,
  },
});

export default GuessWhereScreen;
