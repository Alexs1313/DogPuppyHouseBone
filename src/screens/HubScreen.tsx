import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import Layout from '../components/Layout';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type DogId = 'dog-1' | 'dog-2' | 'dog-3' | 'dog-4';

type DogState = {
  id: DogId;
  hunger: number;
  thirst: number;
  image?: any;
};

type DogCardProps = {
  dog: DogState;
  unlocked: boolean;
  index: number;
  isSelected: boolean;
  flashKind?: 'food' | 'water' | null;
  onPress: (id: DogId) => void;
};

const { width: W, height: H } = Dimensions.get('window');
const isLandscape = W > H;

const s = isLandscape ? W / 844 : Math.min(W / 390, H / 844);

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const STORAGE_FOOD_COUNT = 'FOOD_COUNT';
const STORAGE_WATER_COUNT = 'WATER_COUNT';
const STORAGE_UNLOCKED_DOGS = 'UNLOCKED_DOGS';

const ensureNumber = (v: string | null, fallback: number) => {
  if (v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const ensureUnlocked = (v: string | null): DogId[] => {
  try {
    const parsed = v ? JSON.parse(v) : null;
    if (Array.isArray(parsed) && parsed.length) return parsed as DogId[];
  } catch {}
  return ['dog-1'];
};

const DogCard = React.memo(
  ({ dog, unlocked, isSelected, flashKind, onPress }: DogCardProps) => {
    const cardShakeX = useRef(new Animated.Value(0)).current;

    const runLockedCardShake = useCallback(() => {
      cardShakeX.stopAnimation();
      cardShakeX.setValue(0);
      Animated.sequence([
        Animated.timing(cardShakeX, {
          toValue: -7 * s,
          duration: 45,
          useNativeDriver: true,
        }),
        Animated.timing(cardShakeX, {
          toValue: 7 * s,
          duration: 45,
          useNativeDriver: true,
        }),
        Animated.timing(cardShakeX, {
          toValue: -5 * s,
          duration: 40,
          useNativeDriver: true,
        }),
        Animated.timing(cardShakeX, {
          toValue: 5 * s,
          duration: 40,
          useNativeDriver: true,
        }),
        Animated.timing(cardShakeX, {
          toValue: 0,
          duration: 35,
          useNativeDriver: true,
        }),
      ]).start();
    }, [cardShakeX]);

    const handlePress = useCallback(() => {
      if (!unlocked) {
        runLockedCardShake();
        return;
      }
      onPress(dog.id);
    }, [dog.id, onPress, runLockedCardShake, unlocked]);

    return (
      <Animated.View
        style={[styles.cardWrap, { transform: [{ translateX: cardShakeX }] }]}
      >
        <TouchableOpacity activeOpacity={0.85} onPress={handlePress}>
          <ImageBackground
            style={styles.cardBg}
            source={
              unlocked
                ? require('../assets/images/unlockedBg.png')
                : require('../assets/images/lockedBg.png')
            }
            resizeMode="stretch"
          >
            <View
              style={[styles.card, isSelected && unlocked && styles.cardSelected]}
            >
              {unlocked ? (
                <>
                  {flashKind ? (
                    <Image
                      source={
                        flashKind === 'food'
                          ? require('../assets/images/foodbowl.png')
                          : require('../assets/images/waterbowl.png')
                      }
                      style={styles.cardFlashBowl}
                      resizeMode="contain"
                    />
                  ) : null}

                  <Image
                    source={dog.image ?? require('../assets/images/dog1.png')}
                    style={styles.dogImg}
                    resizeMode="contain"
                  />

                  <View style={styles.bars}>
                    <View style={styles.barRow}>
                      <Image
                        source={require('../assets/images/foodbowl.png')}
                        style={styles.foodIcon}
                        resizeMode="contain"
                      />
                      <View style={styles.barBg}>
                        <View
                          style={[styles.barFill, { width: `${dog.hunger}%` }]}
                        />
                      </View>
                    </View>

                    <View style={styles.barRow}>
                      <Image
                        source={require('../assets/images/waterbowl.png')}
                        style={styles.foodIcon}
                        resizeMode="contain"
                      />
                      <View style={styles.barBg}>
                        <View
                          style={[styles.barFill, { width: `${dog.thirst}%` }]}
                        />
                      </View>
                    </View>
                  </View>
                </>
              ) : (
                <ImageBackground
                  source={require('../assets/images/smallButton.png')}
                  style={styles.lockBtn}
                  resizeMode="stretch"
                >
                  <Image
                    source={require('../assets/images/lock.png')}
                    resizeMode="contain"
                  />
                </ImageBackground>
              )}
            </View>
          </ImageBackground>
        </TouchableOpacity>
      </Animated.View>
    );
  },
  (prev, next) =>
    prev.dog === next.dog &&
    prev.unlocked === next.unlocked &&
    prev.isSelected === next.isSelected &&
    prev.flashKind === next.flashKind &&
    prev.index === next.index,
);

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [foodCount, setFoodCount] = useState(5);
  const [waterCount, setWaterCount] = useState(5);

  const [unlockedDogs, setUnlockedDogs] = useState<DogId[]>(['dog-1']);

  const [dogs, setDogs] = useState<DogState[]>([
    {
      id: 'dog-1',
      hunger: 70,
      thirst: 70,
      image: require('../assets/images/dog1.png'),
    },
    {
      id: 'dog-2',
      hunger: 50,
      thirst: 50,
      image: require('../assets/images/dog2.png'),
    },
    {
      id: 'dog-3',
      hunger: 50,
      thirst: 50,
      image: require('../assets/images/dog3.png'),
    },
    {
      id: 'dog-4',
      hunger: 50,
      thirst: 50,
      image: require('../assets/images/dog4.png'),
    },
  ]);

  const [selectedDogId, setSelectedDogId] = useState<DogId>('dog-1');
  const foodShakeX = useRef(new Animated.Value(0)).current;
  const waterShakeX = useRef(new Animated.Value(0)).current;
  const [cardFlash, setCardFlash] = useState<{
    dogId: DogId;
    kind: 'food' | 'water';
  } | null>(null);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showCardFlash = useCallback((dogId: DogId, kind: 'food' | 'water') => {
    setCardFlash({ dogId, kind });
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => {
      setCardFlash(null);
      flashTimeoutRef.current = null;
    }, 1000);
  }, []);

  const runShake = useCallback((value: Animated.Value) => {
    value.stopAnimation();
    value.setValue(0);
    Animated.sequence([
      Animated.timing(value, { toValue: -6 * s, duration: 45, useNativeDriver: true }),
      Animated.timing(value, { toValue: 6 * s, duration: 45, useNativeDriver: true }),
      Animated.timing(value, { toValue: -4 * s, duration: 40, useNativeDriver: true }),
      Animated.timing(value, { toValue: 4 * s, duration: 40, useNativeDriver: true }),
      Animated.timing(value, { toValue: 0, duration: 35, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(
    () => () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    },
    [],
  );

  const loadFromStorage = useCallback(async () => {
    try {
      const [f, w, ud] = await Promise.all([
        AsyncStorage.getItem(STORAGE_FOOD_COUNT),
        AsyncStorage.getItem(STORAGE_WATER_COUNT),
        AsyncStorage.getItem(STORAGE_UNLOCKED_DOGS),
      ]);

      const nextFood = ensureNumber(f, 5);
      const nextWater = ensureNumber(w, 5);
      const nextUnlocked = ensureUnlocked(ud);

      setFoodCount(nextFood);
      setWaterCount(nextWater);
      setUnlockedDogs(nextUnlocked);

      if (f == null)
        await AsyncStorage.setItem(STORAGE_FOOD_COUNT, String(nextFood));
      if (w == null)
        await AsyncStorage.setItem(STORAGE_WATER_COUNT, String(nextWater));
      if (ud == null)
        await AsyncStorage.setItem(
          STORAGE_UNLOCKED_DOGS,
          JSON.stringify(nextUnlocked),
        );

      if (!nextUnlocked.includes(selectedDogId)) setSelectedDogId('dog-1');
    } catch {
      setFoodCount(5);
      setWaterCount(5);
      setUnlockedDogs(['dog-1']);
    }
  }, [selectedDogId]);

  useFocusEffect(
    useCallback(() => {
      loadFromStorage();
    }, [loadFromStorage]),
  );

  const selectedDogIndex = useMemo(
    () => dogs.findIndex(d => d.id === selectedDogId),
    [dogs, selectedDogId],
  );

  const selectedDog = useMemo(
    () => (selectedDogIndex >= 0 ? dogs[selectedDogIndex] : null),
    [dogs, selectedDogIndex],
  );

  const selectDog = useCallback((id: DogId) => {
    setSelectedDogId(id);
  }, []);

  const isUnlocked = useCallback(
    (id: DogId) => unlockedDogs.includes(id) || id === 'dog-1',
    [unlockedDogs],
  );

  const feedSelectedDog = useCallback(() => {
    if (!selectedDog) return;
    if (!isUnlocked(selectedDog.id)) return;

    setFoodCount(c => {
      if (c <= 0) {
        runShake(foodShakeX);
        return c;
      }

      const next = c - 1;
      AsyncStorage.setItem(STORAGE_FOOD_COUNT, String(next));
      showCardFlash(selectedDog.id, 'food');

      setDogs(prev =>
        prev.map(d =>
          d.id === selectedDog.id
            ? { ...d, hunger: clamp(d.hunger + 20, 0, 100) }
            : d,
        ),
      );

      return next;
    });
  }, [foodShakeX, isUnlocked, runShake, selectedDog, showCardFlash]);

  const waterSelectedDog = useCallback(() => {
    if (!selectedDog) return;
    if (!isUnlocked(selectedDog.id)) return;

    setWaterCount(c => {
      if (c <= 0) {
        runShake(waterShakeX);
        return c;
      }

      const next = c - 1;
      AsyncStorage.setItem(STORAGE_WATER_COUNT, String(next));
      showCardFlash(selectedDog.id, 'water');

      setDogs(prev =>
        prev.map(d =>
          d.id === selectedDog.id
            ? { ...d, thirst: clamp(d.thirst + 20, 0, 100) }
            : d,
        ),
      );

      return next;
    });
  }, [isUnlocked, runShake, selectedDog, showCardFlash, waterShakeX]);

  return (
    <Layout>
      <ImageBackground
        source={require('../assets/images/headerframe.png')}
        style={styles.header}
        resizeMode="stretch"
      >
        <Text style={styles.headerText}>Home</Text>
      </ImageBackground>

      <View style={styles.topCounters}>
        <Animated.View style={{ transform: [{ translateX: foodShakeX }] }}>
          <TouchableOpacity activeOpacity={0.85} onPress={feedSelectedDog}>
            <ImageBackground
              source={require('../assets/images/smallButton.png')}
              style={styles.counterFrame}
              resizeMode="stretch"
            >
              <Text style={styles.counterText}>{foodCount}</Text>
              <Image
                source={require('../assets/images/foodbowl.png')}
                style={styles.counterIcon}
                resizeMode="contain"
              />
            </ImageBackground>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ translateX: waterShakeX }] }}>
          <TouchableOpacity activeOpacity={0.85} onPress={waterSelectedDog}>
            <ImageBackground
              source={require('../assets/images/smallButton.png')}
              style={styles.counterFrame}
              resizeMode="stretch"
            >
              <Text style={styles.counterText}>{waterCount}</Text>
              <Image
                source={require('../assets/images/waterbowl.png')}
                style={styles.counterIcon}
                resizeMode="contain"
              />
            </ImageBackground>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.grid}>
        {dogs.map((dog, i) => (
          <DogCard
            key={dog.id}
            dog={dog}
            unlocked={isUnlocked(dog.id)}
            index={i}
            isSelected={dog.id === selectedDogId}
            flashKind={
              cardFlash && cardFlash.dogId === dog.id ? cardFlash.kind : null
            }
            onPress={selectDog}
          />
        ))}
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('MarketScreen')}
        >
          <ImageBackground
            source={require('../assets/images/smallButton.png')}
            style={styles.bottomSmallBtn}
            resizeMode="stretch"
          >
            <Image
              source={require('../assets/images/market.png')}
              style={styles.bottomIcon}
              resizeMode="contain"
            />
          </ImageBackground>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('DogGameScreen')}
        >
          <ImageBackground
            source={require('../assets/images/mainbutton.png')}
            style={styles.bottomCenter}
            resizeMode="stretch"
          >
            <Text style={styles.bottomText}>Game</Text>
          </ImageBackground>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('SkinsScreen')}
        >
          <ImageBackground
            source={require('../assets/images/smallButton.png')}
            style={styles.bottomSmallBtn}
            resizeMode="stretch"
          >
            <Image
              source={require('../assets/images/collection.png')}
              style={styles.bottomIcon}
              resizeMode="contain"
            />
          </ImageBackground>
        </TouchableOpacity>
      </View>
    </Layout>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  header: {
    alignSelf: 'center',
    marginTop: 40 * s,
    width: 330 * s,
    height: 90 * s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 26 * s,
    color: '#1b0d05',
    fontFamily: 'Kanit-SemiBold',
    marginTop: -10 * s,
  },
  topCounters: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 18 * s,
    marginTop: 14 * s,
  },
  counterFrame: {
    width: 71 * s,
    height: 71 * s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: {
    position: 'absolute',
    top: 8 * s,
    fontSize: 14 * s,
    color: '#59173E',
    fontFamily: 'Kanit-SemiBold',
  },
  counterIcon: {
    width: 34 * s,
    height: 34 * s,
    marginTop: 10 * s,
  },
  grid: {
    alignSelf: 'center',
    marginTop: 20 * s,
    width: 340 * s,
    height: 510 * s,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    paddingVertical: 10 * s,
  },
  cardWrap: {
    width: 160 * s,
    height: 200 * s,
  },
  cardBg: {
    width: 160 * s,
    height: 200 * s,
    justifyContent: 'flex-start',
  },
  card: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFlashBowl: {
    position: 'absolute',
    top: 12 * s,
    right: 12 * s,
    width: 28 * s,
    height: 28 * s,
    zIndex: 3,
  },
  cardSelected: {
    borderColor: '#2b74ff',
  },
  dogImg: {
    width: 81 * s,
    height: 106 * s,
    position: 'absolute',
    top: 50,
    zIndex: 2,
    right: 20,
  },
  bars: {
    width: '88%',
    gap: 6 * s,
    position: 'absolute',
    top: 200 * s,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7 * s,
  },
  foodIcon: {
    width: 24,
    height: 24,
  },
  barBg: {
    flex: 1,
    height: 10 * s,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.15)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  lockBtn: {
    width: 71,
    height: 71,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8 * s,
    flex: 1,
    marginBottom: 20 * s,
    flexWrap: 'wrap',
    marginTop: 20 * s,
  },
  bottomSmallBtn: {
    width: 70 * s,
    height: 70 * s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomIcon: {
    width: 32 * s,
    height: 32 * s,
    bottom: 2 * s,
  },
  bottomCenter: {
    width: 210 * s,
    height: 70 * s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomText: {
    fontSize: 22 * s,
    color: '#fff',
    fontFamily: 'Kanit-SemiBold',
    marginTop: -2 * s,
  },
});
