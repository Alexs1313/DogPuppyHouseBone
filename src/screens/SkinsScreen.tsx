import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Layout from '../components/Layout';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

const { width: W, height: H } = Dimensions.get('window');
const isLandscape = W > H;

const s = isLandscape ? W / 844 : Math.min(W / 390, H / 844);

const STORAGE_SKINS_OWNED = 'SKINS_OWNED';
const STORAGE_SKIN_EQUIPPED = 'SKIN_EQUIPPED';
const STORAGE_GUESS_NEXT_AT = 'GUESS_NEXT_AT';
const STORAGE_GUESS_ATTEMPTS_LEFT = 'GUESS_ATTEMPTS_LEFT';
const STORAGE_GUESS_ACTIVE_DOG = 'GUESS_ACTIVE_DOG';
const STORAGE_GUESS_CORRECT_INDEX = 'GUESS_CORRECT_INDEX';

const STORAGE_GUESS_PENDING_RESULT = 'GUESS_PENDING_RESULT';

type Tab = 'guess' | 'skins';
type DogId = 'dog-1' | 'dog-2' | 'dog-3' | 'dog-4';
type SkinId = 'base' | 'alt';

type OwnedSkinsMap = Record<DogId, SkinId[]>;
type EquippedMap = Record<DogId, SkinId>;

type GuessResult = 'playing' | 'lose' | 'win';

const DAY_MS = 24 * 60 * 60 * 1000;
const GRID = 9;

const DOGS: {
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

const clamp0 = (n: number) => (Number.isFinite(n) ? n : 0);
const now = () => Date.now();
const pad2 = (n: number) => String(n).padStart(2, '0');

const formatLeft = (ms: number) => {
  const t = Math.max(0, ms);
  const hh = Math.floor(t / 3600000);
  const mm = Math.floor((t % 3600000) / 60000);
  const ss = Math.floor((t % 60000) / 1000);
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
};

const getRandInt = (max: number) => Math.floor(Math.random() * max);

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

const ensureEquipped = (v: string | null): EquippedMap => {
  const base: EquippedMap = {
    'dog-1': 'base',
    'dog-2': 'base',
    'dog-3': 'base',
    'dog-4': 'base',
  };
  try {
    const parsed = v ? JSON.parse(v) : null;
    if (parsed && typeof parsed === 'object') {
      (Object.keys(base) as DogId[]).forEach(id => {
        const val = (parsed as any)[id];
        if (val === 'base' || val === 'alt') base[id] = val;
      });
    }
  } catch {}
  return base;
};

const SkinsScreen: React.FC<{ onClose?: () => void }> = ({}) => {
  const [tab, setTab] = useState<Tab>('guess');

  const [owned, setOwned] = useState<OwnedSkinsMap>({
    'dog-1': ['base'],
    'dog-2': ['base'],
    'dog-3': ['base'],
    'dog-4': ['base'],
  });

  const [equipped, setEquipped] = useState<EquippedMap>({
    'dog-1': 'base',
    'dog-2': 'base',
    'dog-3': 'base',
    'dog-4': 'base',
  });

  const [selectedDogIndex, setSelectedDogIndex] = useState(0);
  const selectedDog = useMemo(() => DOGS[selectedDogIndex], [selectedDogIndex]);
  const selectedDogId = selectedDog.id;

  const [skinIndex, setSkinIndex] = useState(0);
  const selectedSkin: SkinId = skinIndex === 1 ? 'alt' : 'base';

  const navigation = useNavigation();

  const [attemptsLeft, setAttemptsLeft] = useState(2);
  const [nextAt, setNextAt] = useState<number>(0);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [activeGuessDog, setActiveGuessDog] = useState<DogId>('dog-1');
  const [tick, setTick] = useState(0);

  const [guessResult, setGuessResult] = useState<GuessResult>('playing');

  const canPlay = useMemo(() => now() >= nextAt, [nextAt]);
  const timeLeft = useMemo(() => Math.max(0, nextAt - now()), [nextAt, tick]);

  useEffect(() => {
    (async () => {
      try {
        const [o, e, na, al, gd, ci, pending] = await Promise.all([
          AsyncStorage.getItem(STORAGE_SKINS_OWNED),
          AsyncStorage.getItem(STORAGE_SKIN_EQUIPPED),
          AsyncStorage.getItem(STORAGE_GUESS_NEXT_AT),
          AsyncStorage.getItem(STORAGE_GUESS_ATTEMPTS_LEFT),
          AsyncStorage.getItem(STORAGE_GUESS_ACTIVE_DOG),
          AsyncStorage.getItem(STORAGE_GUESS_CORRECT_INDEX),
          AsyncStorage.getItem(STORAGE_GUESS_PENDING_RESULT),
        ]);

        const ownedMap = ensureOwned(o);
        setOwned(ownedMap);

        const equipMap = ensureEquipped(e);
        setEquipped(equipMap);

        const next = na ? clamp0(Number(na)) : 0;
        setNextAt(next);

        const cooldownOver = now() >= next;

        if (cooldownOver) {
          setGuessResult('playing');
          setAttemptsLeft(2);
          setCorrectIndex(null);

          const pickDog = DOGS[getRandInt(DOGS.length)].id;
          setActiveGuessDog(pickDog);

          await Promise.all([
            AsyncStorage.setItem(STORAGE_GUESS_ATTEMPTS_LEFT, '2'),
            AsyncStorage.setItem(STORAGE_GUESS_ACTIVE_DOG, pickDog),
            AsyncStorage.removeItem(STORAGE_GUESS_CORRECT_INDEX),
            AsyncStorage.removeItem(STORAGE_GUESS_PENDING_RESULT),
          ]);
        } else {
          const att = al ? clamp0(Number(al)) : 2;
          setAttemptsLeft(att);

          const storedDog = (gd as DogId) || 'dog-1';
          setActiveGuessDog(storedDog);

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

        if (!o) {
          await AsyncStorage.setItem(
            STORAGE_SKINS_OWNED,
            JSON.stringify(ownedMap),
          );
        }
        if (!e) {
          await AsyncStorage.setItem(
            STORAGE_SKIN_EQUIPPED,
            JSON.stringify(equipMap),
          );
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const hasAltForDog = useMemo(
    () => (owned[selectedDogId] || ['base']).includes('alt'),
    [owned, selectedDogId],
  );

  useEffect(() => {
    const eq = equipped[selectedDogId] || 'base';
    const altOwned = (owned[selectedDogId] || ['base']).includes('alt');

    if (!altOwned) {
      setSkinIndex(0);
      return;
    }

    setSkinIndex(eq === 'alt' ? 1 : 0);
  }, [equipped, owned, selectedDogId]);

  const dressSelected = useCallback(async () => {
    const toEquip: SkinId = hasAltForDog ? selectedSkin : 'base';
    const next: EquippedMap = { ...equipped, [selectedDogId]: toEquip };
    setEquipped(next);
    await AsyncStorage.setItem(STORAGE_SKIN_EQUIPPED, JSON.stringify(next));
  }, [equipped, hasAltForDog, selectedDogId, selectedSkin]);

  const nextSkin = useCallback(() => {
    if (!hasAltForDog) return;
    setSkinIndex(i => (i + 1) % 2);
  }, [hasAltForDog]);

  const prevSkin = useCallback(() => {
    if (!hasAltForDog) return;
    setSkinIndex(i => (i - 1 + 2) % 2);
  }, [hasAltForDog]);

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
        const dogId = activeGuessDog;
        const already = owned[dogId] || ['base'];
        const hasAlt = already.includes('alt');

        const nextOwned: OwnedSkinsMap = {
          ...owned,
          [dogId]: hasAlt
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
        setAttemptsLeft(0);

        setGuessResult('win');
        await AsyncStorage.setItem(STORAGE_GUESS_PENDING_RESULT, 'win');

        Alert.alert('Congratulations!', `You received a skin for: ${dogId}`, [
          { text: 'OK', onPress: () => setTab('skins') },
        ]);
        return;
      }

      const nextAtt = Math.max(0, attemptsLeft - 1);
      setAttemptsLeft(nextAtt);
      await AsyncStorage.setItem(STORAGE_GUESS_ATTEMPTS_LEFT, String(nextAtt));

      if (nextAtt <= 0) {
        await lockFor24h();

        setGuessResult('lose');
        await AsyncStorage.setItem(STORAGE_GUESS_PENDING_RESULT, 'lose');

        return;
      }
    },
    [
      activeGuessDog,
      attemptsLeft,
      canPlay,
      correctIndex,
      lockFor24h,
      owned,
      startNewRoundIfNeeded,
    ],
  );

  const imgHeader = require('../assets/images/smallHead.png');
  const imgSmallBtn = require('../assets/images/smallButton.png');
  const imgMainBtn = require('../assets/images/mainbutton.png');

  return (
    <Layout>
      <View
        style={{
          flex: 1,
          paddingTop: 50 * s,
          paddingBottom: 12 * s,
          padding: 18 * s,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12 * s,
            marginBottom: 10,
            justifyContent: 'center',
          }}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
          >
            <ImageBackground
              source={imgSmallBtn}
              style={styles.closeBtnBg}
              resizeMode="stretch"
            >
              <Image source={require('../assets/images/close.png')} />
            </ImageBackground>
          </TouchableOpacity>

          <ImageBackground
            source={imgHeader}
            style={styles.header}
            resizeMode="stretch"
          >
            <Text style={styles.headerText}>Skins</Text>
          </ImageBackground>
        </View>

        {tab === 'skins' ? (
          <View style={{ flex: 1 }}>
            <View style={styles.stripRow}>
              {DOGS.map((d, i) => {
                const active = i === selectedDogIndex;
                return (
                  <TouchableOpacity
                    key={d.id}
                    activeOpacity={0.85}
                    onPress={() => setSelectedDogIndex(i)}
                    style={[styles.stripItem, active && styles.stripActive]}
                  >
                    <Image source={d.thumb} style={styles.stripImg} />
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.bigCardOuter}>
              <LinearGradient
                colors={['#EB924D', '#963B34']}
                style={{ borderRadius: 19 * s }}
              >
                <View style={styles.bigCard}>
                  <Image
                    source={
                      selectedDog.skins[hasAltForDog ? selectedSkin : 'base']
                    }
                    style={styles.bigDog}
                    resizeMode="contain"
                  />

                  <Image
                    source={require('../assets/images/markehouse.png')}
                    style={{ position: 'absolute' }}
                  />
                </View>
              </LinearGradient>
            </View>

            <View style={styles.actionRow}>
              {hasAltForDog ? (
                <TouchableOpacity activeOpacity={0.85} onPress={prevSkin}>
                  <ImageBackground
                    source={imgSmallBtn}
                    style={styles.arrowBtn}
                    resizeMode="stretch"
                  >
                    <Text style={styles.arrowText}>←</Text>
                  </ImageBackground>
                </TouchableOpacity>
              ) : (
                <View style={{ width: 70 * s, height: 70 * s }} />
              )}

              <TouchableOpacity activeOpacity={0.85} onPress={dressSelected}>
                <ImageBackground
                  source={imgMainBtn}
                  style={styles.actionBtn}
                  resizeMode="stretch"
                >
                  <Text style={styles.actionText}>Dressed</Text>
                </ImageBackground>
              </TouchableOpacity>

              {hasAltForDog ? (
                <TouchableOpacity activeOpacity={0.85} onPress={nextSkin}>
                  <ImageBackground
                    source={imgSmallBtn}
                    style={styles.arrowBtn}
                    resizeMode="stretch"
                  >
                    <Text style={styles.arrowText}>→</Text>
                  </ImageBackground>
                </TouchableOpacity>
              ) : (
                <View style={{ width: 70 * s, height: 70 * s }} />
              )}
            </View>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {guessResult === 'lose' ? (
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Image
                  source={require('../assets/images/nodogsframe.png')}
                  style={{
                    width: 280 * s,
                    height: 160 * s,
                    marginTop: 30 * s,
                  }}
                  resizeMode="contain"
                />

                <ImageBackground
                  source={require('../assets/images/textboard.png')}
                  style={{
                    width: 300 * s,
                    height: 140 * s,
                    marginTop: 48 * s,
                  }}
                  resizeMode="stretch"
                >
                  <View
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingHorizontal: 14 * s,
                    }}
                  >
                    <Text
                      style={{
                        color: '#fff',
                        fontFamily: 'Kanit-SemiBold',
                        fontSize: 22 * s,
                      }}
                    >
                      It's empty here...
                    </Text>
                    <Text
                      style={{
                        color: 'rgba(255,255,255,0.9)',
                        fontFamily: 'Kanit-SemiBold',
                        fontSize: 13 * s,
                        marginTop: 10 * s,
                        textAlign: 'center',
                      }}
                    >
                      We are sure that next time{'\n'}you will definitely be
                      lucky!
                    </Text>
                  </View>
                </ImageBackground>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    shareEmptyResult();
                  }}
                  style={{ marginTop: 54 * s }}
                >
                  <ImageBackground
                    source={require('../assets/images/mainbutton.png')}
                    style={{
                      width: 220 * s,
                      height: 70 * s,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    resizeMode="stretch"
                  >
                    <Text
                      style={{
                        color: '#fff',
                        fontFamily: 'Kanit-SemiBold',
                        fontSize: 22 * s,
                        marginTop: -2 * s,
                      }}
                    >
                      Share
                    </Text>
                  </ImageBackground>
                </TouchableOpacity>
              </View>
            ) : (
              <>
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
                      <TouchableOpacity
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
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}

        <View style={styles.tabsRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setTab('guess')}
          >
            <ImageBackground
              source={require('../assets/images/mainbutton.png')}
              style={[
                styles.tabBtn,
                tab === 'guess' ? styles.tabActive : styles.tabInactive,
              ]}
              resizeMode="stretch"
            >
              <Text
                style={[
                  styles.tabText,
                  tab === 'guess'
                    ? styles.tabTextActive
                    : styles.tabTextInactive,
                ]}
              >
                Guess where
              </Text>
            </ImageBackground>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setTab('skins')}
          >
            <ImageBackground
              source={require('../assets/images/mainbutton.png')}
              style={[
                styles.tabBtn,
                tab === 'skins' ? styles.tabActive : styles.tabInactive,
              ]}
              resizeMode="stretch"
            >
              <Text
                style={[
                  styles.tabText,
                  tab === 'skins'
                    ? styles.tabTextActive
                    : styles.tabTextInactive,
                ]}
              >
                Skins
              </Text>
            </ImageBackground>
          </TouchableOpacity>
        </View>
      </View>
    </Layout>
  );
};

export default SkinsScreen;

const styles = StyleSheet.create({
  closeBtnBg: {
    width: 71 * s,
    height: 71 * s,
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
  header: {
    alignSelf: 'center',
    width: 284 * s,
    height: 102 * s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 26 * s,
    color: '#1b0d05',
    fontFamily: 'Kanit-SemiBold',
    marginTop: -6 * s,
  },

  stripRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10 * s,
    marginTop: 18 * s,
    paddingHorizontal: 12 * s,
  },
  stripItem: {
    width: 72 * s,
    height: 72 * s,
    borderRadius: 5 * s,
  },
  stripActive: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  stripImg: {
    width: '100%',
    height: '100%',
  },
  bigCardOuter: {
    width: 290 * s,
    height: 290 * s,
    borderRadius: 20 * s,
    borderWidth: 2,
    borderColor: '#59173E',
    alignSelf: 'center',
    marginTop: 18 * s,
    overflow: 'hidden',
  },
  bigCard: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigDog: {
    width: 136,
    height: 170,
    zIndex: 2,
    right: -50,
  },

  actionRow: {
    marginTop: 18 * s,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18 * s,
  },
  arrowBtn: {
    width: 70 * s,
    height: 70 * s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    color: '#fff',
    fontSize: 24 * s,
    fontFamily: 'Kanit-SemiBold',
  },
  actionBtn: {
    width: 200 * s,
    height: 70 * s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 22 * s,
    color: '#fff',
    fontFamily: 'Kanit-SemiBold',
    marginTop: -2 * s,
  },

  attemptsBoard: {
    alignSelf: 'center',
    marginTop: 16 * s,
    width: 300 * s,
    height: 64 * s,
    justifyContent: 'center',
    alignItems: 'center',
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
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 18 * s,
    marginBottom: 24 * s,
    gap: 10 * s,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  tabBtn: {
    height: 64 * s,
    justifyContent: 'center',
    alignItems: 'center',
    width: 160,
  },
  tabActive: { opacity: 1 },
  tabInactive: { opacity: 0.9 },
  tabText: {
    fontSize: 20 * s,
    fontFamily: 'Kanit-SemiBold',
    marginTop: -2 * s,
  },
  tabTextActive: { color: '#fff' },
  tabTextInactive: { color: '#59173E' },
});
