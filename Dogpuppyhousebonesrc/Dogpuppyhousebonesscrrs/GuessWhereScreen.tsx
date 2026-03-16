import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Layout from '../Dogpuppyhousebonecmpnts/Layout';
import { useNavigation } from '@react-navigation/native';
import AnimatedPressable from '../Dogpuppyhousebonecmpnts/AnimatedPressable';

const { width: W, height: H } = Dimensions.get('window');
const isLandscape = W > H;
const s = isLandscape ? W / 844 : Math.min(W / 390, H / 844);

const STORAGE_SKINS_OWNED = 'SKINS_OWNED';
const STORAGE_GUESS_NEXT_AT = 'GUESS_NEXT_AT';
const STORAGE_GUESS_ATTEMPTS_LEFT = 'GUESS_ATTEMPTS_LEFT';
const STORAGE_GUESS_ACTIVE_DOG = 'GUESS_ACTIVE_DOG';
const STORAGE_GUESS_CORRECT_INDEX = 'GUESS_CORRECT_INDEX';
const STORAGE_GUESS_PENDING_RESULT = 'GUESS_PENDING_RESULT';

type DogId = 'dog-1' | 'dog-2' | 'dog-3' | 'dog-4';
type SkinId = 'base' | 'alt';
type OwnedSkinsMap = Record<DogId, SkinId[]>;
type GuessResult = 'playing' | 'lose' | 'win';

const DAY_MS = 24 * 60 * 60 * 1000;
const GRID = 9;

const DOG_IDS: DogId[] = ['dog-1', 'dog-2', 'dog-3', 'dog-4'];

const clamp0 = (n: number) => (Number.isFinite(n) ? n : 0);
const now = () => Date.now();
const pad2 = (n: number) => String(n).padStart(2, '0');
const getRandInt = (max: number) => Math.floor(Math.random() * max);

const formatLeft = (ms: number) => {
  const t = Math.max(0, ms);
  const hh = Math.floor(t / 3600000);
  const mm = Math.floor((t % 3600000) / 60000);
  const ss = Math.floor((t % 60000) / 1000);
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
};

const ensureOwned = (v: string | null): OwnedSkinsMap => {
  const base: OwnedSkinsMap = {
    'dog-1': ['base'],
    'dog-2': ['base'],
    'dog-3': ['base'],
    'dog-4': ['base'],
  };
  try {
    const parsed = v ? JSON.parse(v) : null;
    if (parsed && typeof parsed === 'object') {
      (Object.keys(base) as DogId[]).forEach(id => {
        const arr = (parsed as any)[id];
        if (Array.isArray(arr) && arr.length) base[id] = arr as SkinId[];
      });
    }
  } catch {}
  return base;
};

const GuessWhereScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [owned, setOwned] = useState<OwnedSkinsMap>({
    'dog-1': ['base'],
    'dog-2': ['base'],
    'dog-3': ['base'],
    'dog-4': ['base'],
  });

  const [attemptsLeft, setAttemptsLeft] = useState(2);
  const [nextAt, setNextAt] = useState<number>(0);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [activeGuessDog, setActiveGuessDog] = useState<DogId>('dog-1');
  const [guessResult, setGuessResult] = useState<GuessResult>('playing');
  const [tick, setTick] = useState(0);

  const canPlay = useMemo(() => now() >= nextAt, [nextAt]);
  const timeLeft = useMemo(() => Math.max(0, nextAt - now()), [nextAt, tick]);

  useEffect(() => {
    (async () => {
      try {
        const [o, na, al, gd, ci, pending] = await Promise.all([
          AsyncStorage.getItem(STORAGE_SKINS_OWNED),
          AsyncStorage.getItem(STORAGE_GUESS_NEXT_AT),
          AsyncStorage.getItem(STORAGE_GUESS_ATTEMPTS_LEFT),
          AsyncStorage.getItem(STORAGE_GUESS_ACTIVE_DOG),
          AsyncStorage.getItem(STORAGE_GUESS_CORRECT_INDEX),
          AsyncStorage.getItem(STORAGE_GUESS_PENDING_RESULT),
        ]);

        const ownedMap = ensureOwned(o);
        setOwned(ownedMap);
        if (!o) {
          await AsyncStorage.setItem(
            STORAGE_SKINS_OWNED,
            JSON.stringify(ownedMap),
          );
        }

        const next = na ? clamp0(Number(na)) : 0;
        setNextAt(next);

        const cooldownOver = now() >= next;
        if (cooldownOver) {
          const pickDog = DOG_IDS[getRandInt(DOG_IDS.length)];
          setGuessResult('playing');
          setAttemptsLeft(2);
          setCorrectIndex(null);
          setActiveGuessDog(pickDog);
          await Promise.all([
            AsyncStorage.setItem(STORAGE_GUESS_ATTEMPTS_LEFT, '2'),
            AsyncStorage.setItem(STORAGE_GUESS_ACTIVE_DOG, pickDog),
            AsyncStorage.removeItem(STORAGE_GUESS_CORRECT_INDEX),
            AsyncStorage.removeItem(STORAGE_GUESS_PENDING_RESULT),
          ]);
        } else {
          setAttemptsLeft(al ? clamp0(Number(al)) : 2);
          setActiveGuessDog(((gd as DogId) || 'dog-1') as DogId);
          setCorrectIndex(ci != null ? clamp0(Number(ci)) : null);

          if (pending === 'lose') {
            setGuessResult('lose');
            AsyncStorage.removeItem(STORAGE_GUESS_PENDING_RESULT);
          } else if (pending === 'win') {
            setGuessResult('win');
            AsyncStorage.removeItem(STORAGE_GUESS_PENDING_RESULT);
          } else {
            setGuessResult('playing');
          }
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const startNewRoundIfNeeded = useCallback(async () => {
    if (correctIndex != null) return;
    const idx = getRandInt(GRID);
    setCorrectIndex(idx);
    await AsyncStorage.setItem(STORAGE_GUESS_CORRECT_INDEX, String(idx));
  }, [correctIndex]);

  const lockFor24h = useCallback(async () => {
    const next = now() + DAY_MS;
    setNextAt(next);
    await AsyncStorage.setItem(STORAGE_GUESS_NEXT_AT, String(next));
  }, []);

  const shareEmptyResult = () => {
    Share.share({
      message: `No luck this time. It's empty here...
We are sure that next time you will definitely be lucky!`,
    });
  };

  const onPickCell = useCallback(
    async (idx: number) => {
      if (!canPlay) return;

      await startNewRoundIfNeeded();

      const currentCorrect =
        correctIndex != null
          ? correctIndex
          : Number(await AsyncStorage.getItem(STORAGE_GUESS_CORRECT_INDEX));

      const isWin = idx === currentCorrect;
      if (isWin) {
        const already = owned[activeGuessDog] || ['base'];
        const hasAlt = already.includes('alt');
        const nextOwned: OwnedSkinsMap = {
          ...owned,
          [activeGuessDog]: hasAlt
            ? already
            : (Array.from(new Set([...already, 'alt'])) as SkinId[]),
        };

        setOwned(nextOwned);
        await AsyncStorage.setItem(
          STORAGE_SKINS_OWNED,
          JSON.stringify(nextOwned),
        );
        await lockFor24h();
        await AsyncStorage.setItem(STORAGE_GUESS_ATTEMPTS_LEFT, '0');
        await AsyncStorage.setItem(STORAGE_GUESS_PENDING_RESULT, 'win');
        setAttemptsLeft(0);
        setGuessResult('win');

        Alert.alert('Congratulations!', 'You received a new skin!', [
          { text: 'OK', onPress: () => navigation.navigate('SkinsScreen') },
        ]);
        return;
      }

      const nextAtt = Math.max(0, attemptsLeft - 1);
      setAttemptsLeft(nextAtt);
      await AsyncStorage.setItem(STORAGE_GUESS_ATTEMPTS_LEFT, String(nextAtt));

      if (nextAtt <= 0) {
        await lockFor24h();
        await AsyncStorage.setItem(STORAGE_GUESS_PENDING_RESULT, 'lose');
        setGuessResult('lose');
      }
    },
    [
      activeGuessDog,
      attemptsLeft,
      canPlay,
      correctIndex,
      lockFor24h,
      navigation,
      owned,
      startNewRoundIfNeeded,
    ],
  );

  return (
    <Layout>
      <View style={styles.screenPad}>
        <ImageBackground
          source={require('../assets/images/smallHead.png')}
          style={styles.header}
          resizeMode="stretch"
        >
          <Text style={styles.headerText}>Guess where</Text>
        </ImageBackground>

        {guessResult === 'lose' ? (
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Image
              source={require('../assets/images/nodogsframe.png')}
              style={styles.loseImage}
              resizeMode="contain"
            />
            <ImageBackground
              source={require('../assets/images/textboard.png')}
              style={styles.loseTextBoard}
              resizeMode="stretch"
            >
              <View style={styles.loseTextInner}>
                <Text style={styles.loseTitle}>It's empty here...</Text>
                <Text style={styles.loseBody}>
                  We are sure that next time{'\n'}you will definitely be lucky!
                </Text>
              </View>
            </ImageBackground>
            <AnimatedPressable activeOpacity={0.85} onPress={shareEmptyResult}>
              <ImageBackground
                source={require('../assets/images/mainbutton.png')}
                style={styles.shareBtn}
                resizeMode="stretch"
              >
                <Text style={styles.shareText}>Share</Text>
              </ImageBackground>
            </AnimatedPressable>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {canPlay ? (
              <ImageBackground
                source={require('../assets/images/scoreboard.png')}
                style={styles.attemptsBoard}
                resizeMode="stretch"
              >
                <Text style={styles.attemptsText}>
                  You have {attemptsLeft}/2 attempts.
                </Text>
              </ImageBackground>
            ) : (
              <ImageBackground
                source={require('../assets/images/scoreboard.png')}
                style={styles.timeBoard}
                resizeMode="stretch"
              >
                <Text style={[styles.attemptsText, { fontSize: 24 }]}>
                  {formatLeft(timeLeft)}
                </Text>
              </ImageBackground>
            )}

            {canPlay && (
              <View style={styles.grid}>
                {Array.from({ length: GRID }).map((_, idx) => (
                  <AnimatedPressable
                    key={idx}
                    activeOpacity={0.9}
                    onPress={() => onPickCell(idx)}
                    disabled={!canPlay || attemptsLeft <= 0}
                    style={styles.cell}
                  >
                    <ImageBackground
                      source={require('../assets/images/unlockedBg.png')}
                      style={styles.cellBg}
                      resizeMode="stretch"
                    />
                  </AnimatedPressable>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  screenPad: {
    flex: 1,
    paddingTop: 50 * s,
    paddingBottom: 120,
    paddingHorizontal: 18 * s,
  },
  header: {
    alignSelf: 'center',
    width: 284 * s,
    height: 102 * s,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerText: {
    fontSize: 26 * s,
    color: '#1b0d05',
    fontFamily: 'Kanit-SemiBold',
    marginTop: -11 * s,
  },
  attemptsBoard: {
    alignSelf: 'center',
    marginTop: 16 * s,
    width: 300 * s,
    height: 64 * s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeBoard: {
    width: 237 * s,
    height: 86 * s,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 130 * s,
  },
  attemptsText: {
    color: '#fff',
    fontFamily: 'Kanit-SemiBold',
    fontSize: 16 * s,
  },
  grid: {
    alignSelf: 'center',
    marginTop: 35 * s,
    width: 340 * s,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8 * s,
    marginBottom: 30 * s,
  },
  cell: {
    width: 100 * s,
    height: 100 * s,
  },
  cellBg: {
    width: '100%',
    height: '100%',
  },
  loseImage: {
    width: 280 * s,
    height: 160 * s,
    marginTop: 30 * s,
  },
  loseTextBoard: {
    width: 300 * s,
    height: 140 * s,
    marginTop: 48 * s,
  },
  loseTextInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14 * s,
  },
  loseTitle: {
    color: '#fff',
    fontFamily: 'Kanit-SemiBold',
    fontSize: 22 * s,
  },
  loseBody: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Kanit-SemiBold',
    fontSize: 13 * s,
    marginTop: 10 * s,
    textAlign: 'center',
  },
  shareBtn: {
    width: 220 * s,
    height: 70 * s,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 54 * s,
  },
  shareText: {
    color: '#fff',
    fontFamily: 'Kanit-SemiBold',
    fontSize: 22 * s,
    marginTop: -2 * s,
  },
});

export default GuessWhereScreen;
