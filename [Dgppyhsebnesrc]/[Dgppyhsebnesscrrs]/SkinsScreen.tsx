import LinearGradient from 'react-native-linear-gradient';

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
import Layout from '../Dgppyhuseboncmpnts/Layout';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

const puppBonW = Dimensions.get('window').width;
const puppBonH = Dimensions.get('window').height;
const puppBonIsLandscape = puppBonW > puppBonH;

const puppBonS = puppBonIsLandscape
  ? puppBonW / 844
  : Math.min(puppBonW / 390, puppBonH / 844);

const puppBonStorageSkinsOwned = 'SKINS_OWNED';
const puppBonStorageSkinEquipped = 'SKIN_EQUIPPED';
const puppBonStorageGuessNextAt = 'GUESS_NEXT_AT';
const puppBonStorageGuessAttemptsLeft = 'GUESS_ATTEMPTS_LEFT';
const puppBonStorageGuessActiveDog = 'GUESS_ACTIVE_DOG';
const puppBonStorageGuessCorrectIndex = 'GUESS_CORRECT_INDEX';
const puppBonStorageGuessPendingResult = 'GUESS_PENDING_RESULT';

type Tab = 'guess' | 'skins';
type DogId = 'dog-1' | 'dog-2' | 'dog-3' | 'dog-4';
type SkinId = 'base' | 'alt';

type OwnedSkinsMap = Record<DogId, SkinId[]>;
type EquippedMap = Record<DogId, SkinId>;

type GuessResult = 'playing' | 'lose' | 'win';

const puppBonDayMs = 24 * 60 * 60 * 1000;
const puppBonGrid = 9;

const puppBonDogs: {
  id: DogId;
  name: string;
  thumb: any;
  skins: Record<SkinId, any>;
}[] = [
  {
    id: 'dog-1',
    name: 'Pug',
    thumb: require('../assets/images/dog1_frame.png'),
    skins: {
      base: require('../assets/images/dog1.png'),
      alt: require('../assets/images/dog1_alt.png'),
    },
  },
  {
    id: 'dog-2',
    name: 'Beagle',
    thumb: require('../assets/images/dog2_frame.png'),
    skins: {
      base: require('../assets/images/dog2.png'),
      alt: require('../assets/images/dog2_alt.png'),
    },
  },
  {
    id: 'dog-3',
    name: 'Maltese',
    thumb: require('../assets/images/dog3_frame.png'),
    skins: {
      base: require('../assets/images/dog3.png'),
      alt: require('../assets/images/dog3_alt.png'),
    },
  },
  {
    id: 'dog-4',
    name: 'Rottweiler',
    thumb: require('../assets/images/dog4_frame.png'),
    skins: {
      base: require('../assets/images/dog4.png'),
      alt: require('../assets/images/dog4_alt.png'),
    },
  },
];

const puppBonClamp0 = (n: number) => (Number.isFinite(n) ? n : 0);
const puppBonNow = () => Date.now();
const puppBonPad2 = (n: number) => String(n).padStart(2, '0');

const puppBonFormatLeft = (ms: number) => {
  const puppBonT = Math.max(0, ms);
  const puppBonHh = Math.floor(puppBonT / 3600000);
  const puppBonMm = Math.floor((puppBonT % 3600000) / 60000);
  const puppBonSs = Math.floor((puppBonT % 60000) / 1000);
  return `${puppBonPad2(puppBonHh)}:${puppBonPad2(puppBonMm)}:${puppBonPad2(
    puppBonSs,
  )}`;
};

const puppBonGetRandInt = (max: number) => Math.floor(Math.random() * max);

const puppBonEnsureOwned = (v: string | null): OwnedSkinsMap => {
  const puppBonBase: OwnedSkinsMap = {
    'dog-1': ['base', 'alt'],
    'dog-2': ['base', 'alt'],
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
    (['dog-1', 'dog-2'] as DogId[]).forEach(id => {
      const puppBonList = puppBonBase[id];
      if (!puppBonList.includes('alt')) {
        puppBonBase[id] = [...puppBonList, 'alt'] as SkinId[];
      }
    });
  } catch {}
  return puppBonBase;
};

const puppBonEnsureEquipped = (v: string | null): EquippedMap => {
  const puppBonBase: EquippedMap = {
    'dog-1': 'base',
    'dog-2': 'base',
    'dog-3': 'base',
    'dog-4': 'base',
  };
  try {
    const puppBonParsed = v ? JSON.parse(v) : null;
    if (puppBonParsed && typeof puppBonParsed === 'object') {
      (Object.keys(puppBonBase) as DogId[]).forEach(id => {
        const puppBonVal = (puppBonParsed as any)[id];
        if (puppBonVal === 'base' || puppBonVal === 'alt') {
          puppBonBase[id] = puppBonVal;
        }
      });
    }
  } catch {}
  return puppBonBase;
};

const SkinsScreen: React.FC<{ onClose?: () => void }> = ({}) => {
  const [puppBonTab, setPuppBonTab] = useState<Tab>('skins');

  const [puppBonOwned, setPuppBonOwned] = useState<OwnedSkinsMap>({
    'dog-1': ['base', 'alt'],
    'dog-2': ['base', 'alt'],
    'dog-3': ['base'],
    'dog-4': ['base'],
  });

  const [puppBonEquipped, setPuppBonEquipped] = useState<EquippedMap>({
    'dog-1': 'base',
    'dog-2': 'base',
    'dog-3': 'base',
    'dog-4': 'base',
  });

  const [puppBonSelectedDogIndex, setPuppBonSelectedDogIndex] = useState(0);
  const puppBonSelectedDog = useMemo(
    () => puppBonDogs[puppBonSelectedDogIndex],
    [puppBonSelectedDogIndex],
  );
  const puppBonSelectedDogId = puppBonSelectedDog.id;

  const [puppBonSkinIndex, setPuppBonSkinIndex] = useState(0);
  const puppBonSelectedSkin: SkinId = puppBonSkinIndex === 1 ? 'alt' : 'base';

  const puppBonNavigation = useNavigation();

  const [puppBonAttemptsLeft, setPuppBonAttemptsLeft] = useState(2);
  const [puppBonNextAt, setPuppBonNextAt] = useState<number>(0);
  const [puppBonCorrectIndex, setPuppBonCorrectIndex] = useState<number | null>(
    null,
  );
  const [puppBonActiveGuessDog, setPuppBonActiveGuessDog] =
    useState<DogId>('dog-1');
  const [puppBonTick, setPuppBonTick] = useState(0);
  const puppBonStripEntrance = useRef(
    puppBonDogs.map(() => new Animated.Value(0)),
  ).current;
  const puppBonSkinsMainEntrance = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const [puppBonGuessResult, setPuppBonGuessResult] =
    useState<GuessResult>('playing');

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
          puppBonE,
          puppBonNa,
          puppBonAl,
          puppBonGd,
          puppBonCi,
          puppBonPending,
        ] = await Promise.all([
          AsyncStorage.getItem(puppBonStorageSkinsOwned),
          AsyncStorage.getItem(puppBonStorageSkinEquipped),
          AsyncStorage.getItem(puppBonStorageGuessNextAt),
          AsyncStorage.getItem(puppBonStorageGuessAttemptsLeft),
          AsyncStorage.getItem(puppBonStorageGuessActiveDog),
          AsyncStorage.getItem(puppBonStorageGuessCorrectIndex),
          AsyncStorage.getItem(puppBonStorageGuessPendingResult),
        ]);

        const puppBonOwnedMap = puppBonEnsureOwned(puppBonO);
        setPuppBonOwned(puppBonOwnedMap);

        const puppBonEquipMap = puppBonEnsureEquipped(puppBonE);
        setPuppBonEquipped(puppBonEquipMap);

        const puppBonNext = puppBonNa ? puppBonClamp0(Number(puppBonNa)) : 0;
        setPuppBonNextAt(puppBonNext);

        const puppBonCooldownOver = puppBonNow() >= puppBonNext;

        if (puppBonCooldownOver) {
          setPuppBonGuessResult('playing');
          setPuppBonAttemptsLeft(2);
          setPuppBonCorrectIndex(null);

          const puppBonPickDog =
            puppBonDogs[puppBonGetRandInt(puppBonDogs.length)].id;
          setPuppBonActiveGuessDog(puppBonPickDog);

          await Promise.all([
            AsyncStorage.setItem(puppBonStorageGuessAttemptsLeft, '2'),
            AsyncStorage.setItem(puppBonStorageGuessActiveDog, puppBonPickDog),
            AsyncStorage.removeItem(puppBonStorageGuessCorrectIndex),
            AsyncStorage.removeItem(puppBonStorageGuessPendingResult),
          ]);
        } else {
          const puppBonAtt = puppBonAl ? puppBonClamp0(Number(puppBonAl)) : 2;
          setPuppBonAttemptsLeft(puppBonAtt);

          const puppBonStoredDog = (puppBonGd as DogId) || 'dog-1';
          setPuppBonActiveGuessDog(puppBonStoredDog);

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

        if (!puppBonO) {
          await AsyncStorage.setItem(
            puppBonStorageSkinsOwned,
            JSON.stringify(puppBonOwnedMap),
          );
        }
        if (!puppBonE) {
          await AsyncStorage.setItem(
            puppBonStorageSkinEquipped,
            JSON.stringify(puppBonEquipMap),
          );
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const puppBonId = setInterval(() => setPuppBonTick(t => t + 1), 1000);
    return () => clearInterval(puppBonId);
  }, []);

  const puppBonRunSkinsEntrance = useCallback(() => {
    puppBonStripEntrance.forEach(v => v.setValue(0));
    puppBonSkinsMainEntrance.forEach(v => v.setValue(0));

    Animated.sequence([
      Animated.stagger(
        100,
        puppBonStripEntrance.map(v =>
          Animated.timing(v, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ),
      ),
      Animated.stagger(
        120,
        puppBonSkinsMainEntrance.map(v =>
          Animated.timing(v, {
            toValue: 1,
            duration: 320,
            useNativeDriver: true,
          }),
        ),
      ),
    ]).start();
  }, [puppBonSkinsMainEntrance, puppBonStripEntrance]);

  useFocusEffect(
    useCallback(() => {
      puppBonRunSkinsEntrance();
    }, [puppBonRunSkinsEntrance]),
  );

  const puppBonHasAltForDog = useMemo(
    () => (puppBonOwned[puppBonSelectedDogId] || ['base']).includes('alt'),
    [puppBonOwned, puppBonSelectedDogId],
  );

  const puppBonSelectedToEquip: SkinId = puppBonHasAltForDog
    ? puppBonSelectedSkin
    : 'base';

  const puppBonIsSelectedEquipped =
    (puppBonEquipped[puppBonSelectedDogId] || 'base') ===
    puppBonSelectedToEquip;

  useEffect(() => {
    const puppBonEq = puppBonEquipped[puppBonSelectedDogId] || 'base';
    const puppBonAltOwned = (
      puppBonOwned[puppBonSelectedDogId] || ['base']
    ).includes('alt');

    if (!puppBonAltOwned) {
      setPuppBonSkinIndex(0);
      return;
    }

    setPuppBonSkinIndex(puppBonEq === 'alt' ? 1 : 0);
  }, [puppBonEquipped, puppBonOwned, puppBonSelectedDogId]);

  const puppBonDressSelected = useCallback(async () => {
    const puppBonToEquip: SkinId = puppBonHasAltForDog
      ? puppBonSelectedSkin
      : 'base';
    const puppBonNext: EquippedMap = {
      ...puppBonEquipped,
      [puppBonSelectedDogId]: puppBonToEquip,
    };
    setPuppBonEquipped(puppBonNext);
    await AsyncStorage.setItem(
      puppBonStorageSkinEquipped,
      JSON.stringify(puppBonNext),
    );
  }, [
    puppBonEquipped,
    puppBonHasAltForDog,
    puppBonSelectedDogId,
    puppBonSelectedSkin,
  ]);

  const puppBonNextSkin = useCallback(() => {
    if (!puppBonHasAltForDog) return;
    setPuppBonSkinIndex(i => (i + 1) % 2);
  }, [puppBonHasAltForDog]);

  const puppBonPrevSkin = useCallback(() => {
    if (!puppBonHasAltForDog) return;
    setPuppBonSkinIndex(i => (i - 1 + 2) % 2);
  }, [puppBonHasAltForDog]);

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
        const puppBonDogId = puppBonActiveGuessDog;
        const puppBonAlready = puppBonOwned[puppBonDogId] || ['base'];
        const puppBonHasAlt = puppBonAlready.includes('alt');

        const puppBonNextOwned: OwnedSkinsMap = {
          ...puppBonOwned,
          [puppBonDogId]: puppBonHasAlt
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
        setPuppBonAttemptsLeft(0);

        setPuppBonGuessResult('win');
        await AsyncStorage.setItem(puppBonStorageGuessPendingResult, 'win');

        Alert.alert('Congratulations!', `You received a new skin!`, [
          { text: 'OK', onPress: () => setPuppBonTab('skins') },
        ]);
        return;
      }

      const puppBonNextAtt = Math.max(0, puppBonAttemptsLeft - 1);
      setPuppBonAttemptsLeft(puppBonNextAtt);
      await AsyncStorage.setItem(
        puppBonStorageGuessAttemptsLeft,
        String(puppBonNextAtt),
      );

      if (puppBonNextAtt <= 0) {
        await puppBonLockFor24h();

        setPuppBonGuessResult('lose');
        await AsyncStorage.setItem(puppBonStorageGuessPendingResult, 'lose');

        return;
      }
    },
    [
      puppBonActiveGuessDog,
      puppBonAttemptsLeft,
      puppBonCanPlay,
      puppBonCorrectIndex,
      puppBonLockFor24h,
      puppBonOwned,
      puppBonStartNewRoundIfNeeded,
    ],
  );

  const puppBonImgHeader = require('../assets/images/smallHead.png');
  const puppBonImgSmallBtn = require('../assets/images/smallButton.png');
  const puppBonImgMainBtn = require('../assets/images/mainbutton.png');

  return (
    <Layout>
      <View
        style={{
          flex: 1,
          paddingTop: 50 * puppBonS,
          paddingBottom: 120,
          padding: 18 * puppBonS,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12 * puppBonS,
            marginBottom: 10,
            justifyContent: 'center',
          }}
        >
          <ImageBackground
            source={puppBonImgHeader}
            style={puppBonStyles.puppBonHeader}
            resizeMode="stretch"
          >
            <Text style={puppBonStyles.puppBonHeaderText}>Skins</Text>
          </ImageBackground>
        </View>

        {puppBonTab === 'skins' ? (
          <View style={{ flex: 1 }}>
            <View style={puppBonStyles.puppBonStripRow}>
              {puppBonDogs.map((d, i) => {
                const puppBonActive = i === puppBonSelectedDogIndex;
                return (
                  <Animated.View
                    key={d.id}
                    style={{
                      opacity: puppBonStripEntrance[i],
                      transform: [
                        {
                          translateY: puppBonStripEntrance[i].interpolate({
                            inputRange: [0, 1],
                            outputRange: [14, 0],
                          }),
                        },
                      ],
                    }}
                  >
                    <AnimatedPressable
                      activeOpacity={0.85}
                      onPress={() => setPuppBonSelectedDogIndex(i)}
                      style={[
                        puppBonStyles.puppBonStripItem,
                        puppBonActive && puppBonStyles.puppBonStripActive,
                      ]}
                    >
                      <Image
                        source={d.thumb}
                        style={puppBonStyles.puppBonStripImg}
                      />
                    </AnimatedPressable>
                  </Animated.View>
                );
              })}
            </View>

            <Animated.View
              style={{
                opacity: puppBonSkinsMainEntrance[0],
                transform: [
                  {
                    translateY: puppBonSkinsMainEntrance[0].interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                ],
              }}
            >
              <View style={puppBonStyles.puppBonBigCardOuter}>
                <LinearGradient
                  colors={['#EB924D', '#963B34']}
                  style={{ borderRadius: 19 * puppBonS }}
                >
                  <View style={puppBonStyles.puppBonBigCard}>
                    <Image
                      source={
                        puppBonSelectedDog.skins[
                          puppBonHasAltForDog ? puppBonSelectedSkin : 'base'
                        ]
                      }
                      style={puppBonStyles.puppBonBigDog}
                      resizeMode="contain"
                    />

                    <Image
                      source={require('../assets/images/markehouse.png')}
                      style={{ position: 'absolute' }}
                    />
                  </View>
                </LinearGradient>
              </View>
            </Animated.View>

            <Animated.View
              style={{
                opacity: puppBonSkinsMainEntrance[1],
                transform: [
                  {
                    translateY: puppBonSkinsMainEntrance[1].interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                ],
              }}
            >
              <View style={puppBonStyles.puppBonActionRow}>
                {puppBonHasAltForDog ? (
                  <AnimatedPressable
                    activeOpacity={0.85}
                    onPress={puppBonPrevSkin}
                  >
                    <ImageBackground
                      source={puppBonImgSmallBtn}
                      style={puppBonStyles.puppBonArrowBtn}
                      resizeMode="stretch"
                    >
                      <Image
                        source={require('../assets/images/dghouslrigarr.png')}
                      />
                    </ImageBackground>
                  </AnimatedPressable>
                ) : (
                  <View
                    style={{ width: 70 * puppBonS, height: 70 * puppBonS }}
                  />
                )}

                <AnimatedPressable
                  activeOpacity={0.85}
                  onPress={puppBonDressSelected}
                  disabled={puppBonIsSelectedEquipped}
                >
                  <ImageBackground
                    source={puppBonImgMainBtn}
                    style={puppBonStyles.puppBonActionBtn}
                    resizeMode="stretch"
                  >
                    <Text style={puppBonStyles.puppBonActionText}>
                      {puppBonIsSelectedEquipped ? 'Dressed' : 'To dress'}
                    </Text>
                  </ImageBackground>
                </AnimatedPressable>

                {puppBonHasAltForDog ? (
                  <AnimatedPressable
                    activeOpacity={0.85}
                    onPress={puppBonNextSkin}
                  >
                    <ImageBackground
                      source={puppBonImgSmallBtn}
                      style={puppBonStyles.puppBonArrowBtn}
                      resizeMode="stretch"
                    >
                      <Image
                        source={require('../assets/images/dghousleftarr.png')}
                      />
                    </ImageBackground>
                  </AnimatedPressable>
                ) : (
                  <View
                    style={{ width: 70 * puppBonS, height: 70 * puppBonS }}
                  />
                )}
              </View>
            </Animated.View>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {puppBonGuessResult === 'lose' ? (
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Image
                  source={require('../assets/images/nodogsframe.png')}
                  style={{
                    width: 280 * puppBonS,
                    height: 160 * puppBonS,
                    marginTop: 30 * puppBonS,
                  }}
                  resizeMode="contain"
                />

                <ImageBackground
                  source={require('../assets/images/textboard.png')}
                  style={{
                    width: 300 * puppBonS,
                    height: 140 * puppBonS,
                    marginTop: 48 * puppBonS,
                  }}
                  resizeMode="stretch"
                >
                  <View
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingHorizontal: 14 * puppBonS,
                    }}
                  >
                    <Text
                      style={{
                        color: '#fff',
                        fontFamily: 'Kanit-SemiBold',
                        fontSize: 22 * puppBonS,
                      }}
                    >
                      It's empty here...
                    </Text>
                    <Text
                      style={{
                        color: 'rgba(255,255,255,0.9)',
                        fontFamily: 'Kanit-SemiBold',
                        fontSize: 13 * puppBonS,
                        marginTop: 10 * puppBonS,
                        textAlign: 'center',
                      }}
                    >
                      We are sure that next time{'\n'}you will definitely be
                      lucky!
                    </Text>
                  </View>
                </ImageBackground>

                <AnimatedPressable
                  activeOpacity={0.85}
                  onPress={() => {
                    puppBonShareEmptyResult();
                  }}
                  style={{ marginTop: 54 * puppBonS }}
                >
                  <ImageBackground
                    source={require('../assets/images/mainbutton.png')}
                    style={{
                      width: 220 * puppBonS,
                      height: 70 * puppBonS,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    resizeMode="stretch"
                  >
                    <Text
                      style={{
                        color: '#fff',
                        fontFamily: 'Kanit-SemiBold',
                        fontSize: 22 * puppBonS,
                        marginTop: -2 * puppBonS,
                      }}
                    >
                      Share
                    </Text>
                  </ImageBackground>
                </AnimatedPressable>
              </View>
            ) : (
              <>
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
                      style={[
                        puppBonStyles.puppBonAttemptsText,
                        { fontSize: 24 },
                      ]}
                    >
                      {puppBonFormatLeft(puppBonTimeLeft)}
                    </Text>
                  </ImageBackground>
                )}

                {puppBonCanPlay && (
                  <View style={puppBonStyles.puppBonGrid}>
                    {Array.from({ length: puppBonGrid }).map((_, idx) => (
                      <AnimatedPressable
                        key={idx}
                        activeOpacity={0.9}
                        onPress={() => puppBonOnPickCell(idx)}
                        disabled={!puppBonCanPlay || puppBonAttemptsLeft <= 0}
                        style={puppBonStyles.puppBonCell}
                      >
                        <ImageBackground
                          source={require('../assets/images/unlockedBg.png')}
                          style={puppBonStyles.puppBonCellBg}
                          resizeMode="stretch"
                        />
                      </AnimatedPressable>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </View>
    </Layout>
  );
};

export default SkinsScreen;

const puppBonStyles = StyleSheet.create({
  puppBonCloseBtnBg: {
    width: 71 * puppBonS,
    height: 71 * puppBonS,
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
  puppBonHeader: {
    alignSelf: 'center',
    width: 284 * puppBonS,
    height: 102 * puppBonS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  puppBonHeaderText: {
    fontSize: 26 * puppBonS,
    color: '#1b0d05',
    fontFamily: 'Kanit-SemiBold',
    marginTop: -11 * puppBonS,
  },

  puppBonStripRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10 * puppBonS,
    marginTop: 18 * puppBonS,
    paddingHorizontal: 12 * puppBonS,
  },
  puppBonStripItem: {
    width: 72 * puppBonS,
    height: 72 * puppBonS,
    borderRadius: 5 * puppBonS,
  },
  puppBonStripActive: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  puppBonStripImg: {
    width: '100%',
    height: '100%',
  },
  puppBonBigCardOuter: {
    width: 290 * puppBonS,
    height: 290 * puppBonS,
    borderRadius: 20 * puppBonS,
    borderWidth: 2,
    borderColor: '#59173E',
    alignSelf: 'center',
    marginTop: 18 * puppBonS,
    overflow: 'hidden',
  },
  puppBonBigCard: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  puppBonBigDog: {
    width: 136,
    height: 170,
    zIndex: 2,
    right: -50,
  },

  puppBonActionRow: {
    marginTop: 18 * puppBonS,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  puppBonArrowBtn: {
    width: 70 * puppBonS,
    height: 70 * puppBonS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  puppBonArrowText: {
    color: '#fff',
    fontSize: 24 * puppBonS,
    fontFamily: 'Kanit-SemiBold',
  },
  puppBonActionBtn: {
    width: 200 * puppBonS,
    height: 70 * puppBonS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  puppBonActionText: {
    fontSize: 22 * puppBonS,
    color: '#fff',
    fontFamily: 'Kanit-SemiBold',
    marginTop: -2 * puppBonS,
  },

  puppBonAttemptsBoard: {
    alignSelf: 'center',
    marginTop: 16 * puppBonS,
    width: 300 * puppBonS,
    height: 64 * puppBonS,
    justifyContent: 'center',
    alignItems: 'center',
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
  puppBonTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 18 * puppBonS,
    marginBottom: 24 * puppBonS,
    gap: 10 * puppBonS,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  puppBonTabBtn: {
    height: 64 * puppBonS,
    justifyContent: 'center',
    alignItems: 'center',
    width: 160,
  },
  puppBonTabActive: { opacity: 1 },
  puppBonTabInactive: { opacity: 0.9 },
  puppBonTabText: {
    fontSize: 20 * puppBonS,
    fontFamily: 'Kanit-SemiBold',
    marginTop: -2 * puppBonS,
  },
  puppBonTabTextActive: { color: '#fff' },
  puppBonTabTextInactive: { color: '#59173E' },
});
