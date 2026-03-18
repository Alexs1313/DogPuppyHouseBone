import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimatedPressable from '../Dgppyhuseboncmpnts/AnimatedPressable';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import Layout from '../Dgppyhuseboncmpnts/Layout';
import { useFocusEffect } from '@react-navigation/native';

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

const { width: puppBonW, height: puppBonH } = Dimensions.get('window');
const puppBonIsLandscape = puppBonW > puppBonH;

const puppBonS = puppBonIsLandscape
  ? puppBonW / 844
  : Math.min(puppBonW / 390, puppBonH / 844);

const puppBonClamp = (v: number, a: number, b: number) =>
  Math.max(a, Math.min(b, v));

const puppBonStorageFoodCount = 'FOOD_COUNT';
const puppBonStorageWaterCount = 'WATER_COUNT';
const puppBonDefaultFood = 5;
const puppBonDefaultWater = 5;
const puppBonStorageUnlockedDogs = 'UNLOCKED_DOGS';
const puppBonStorageSkinEquipped = 'SKIN_EQUIPPED';

type SkinId = 'base' | 'alt';

type EquippedMap = Record<DogId, SkinId>;

const puppBonHubDogSkins: Record<DogId, Record<SkinId, any>> = {
  'dog-1': {
    base: require('../assets/images/dog1.png'),
    alt: require('../assets/images/dog1_alt.png'),
  },
  'dog-2': {
    base: require('../assets/images/dog2.png'),
    alt: require('../assets/images/dog2_alt.png'),
  },
  'dog-3': {
    base: require('../assets/images/dog3.png'),
    alt: require('../assets/images/dog3_alt.png'),
  },
  'dog-4': {
    base: require('../assets/images/dog4.png'),
    alt: require('../assets/images/dog4_alt.png'),
  },
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

const puppBonEnsureNumber = (v: string | null, fallback: number) => {
  if (v == null) return fallback;
  const puppBonN = Number(v);
  return Number.isFinite(puppBonN) ? puppBonN : fallback;
};

const puppBonDefaultUnlocked: DogId[] = ['dog-1', 'dog-2'];

const puppBonEnsureUnlocked = (v: string | null): DogId[] => {
  try {
    const puppBonParsed = v ? JSON.parse(v) : null;
    if (Array.isArray(puppBonParsed) && puppBonParsed.length) {
      const puppBonRest = (puppBonParsed as DogId[]).filter(
        id => id !== 'dog-1' && id !== 'dog-2',
      );
      return [...puppBonDefaultUnlocked, ...puppBonRest];
    }
  } catch {}
  return [...puppBonDefaultUnlocked];
};

const DogCard = React.memo(
  ({ dog, unlocked, isSelected, flashKind, onPress }: DogCardProps) => {
    const puppBonCardShakeX = useRef(new Animated.Value(0)).current;

    const puppBonRunLockedCardShake = useCallback(() => {
      puppBonCardShakeX.stopAnimation();
      puppBonCardShakeX.setValue(0);
      Animated.sequence([
        Animated.timing(puppBonCardShakeX, {
          toValue: -7 * puppBonS,
          duration: 45,
          useNativeDriver: true,
        }),
        Animated.timing(puppBonCardShakeX, {
          toValue: 7 * puppBonS,
          duration: 45,
          useNativeDriver: true,
        }),
        Animated.timing(puppBonCardShakeX, {
          toValue: -5 * puppBonS,
          duration: 40,
          useNativeDriver: true,
        }),
        Animated.timing(puppBonCardShakeX, {
          toValue: 5 * puppBonS,
          duration: 40,
          useNativeDriver: true,
        }),
        Animated.timing(puppBonCardShakeX, {
          toValue: 0,
          duration: 35,
          useNativeDriver: true,
        }),
      ]).start();
    }, [puppBonCardShakeX]);

    const puppBonHandlePress = useCallback(() => {
      if (!unlocked) {
        puppBonRunLockedCardShake();
        return;
      }
      onPress(dog.id);
    }, [dog.id, onPress, puppBonRunLockedCardShake, unlocked]);

    return (
      <Animated.View
        style={[
          puppBonStyles.puppBonCardWrap,
          { transform: [{ translateX: puppBonCardShakeX }] },
        ]}
      >
        <AnimatedPressable
          activeOpacity={0.85}
          onPress={puppBonHandlePress}
          disabled={unlocked}
        >
          <ImageBackground
            style={puppBonStyles.puppBonCardBg}
            source={
              unlocked
                ? require('../assets/images/unlockedBg.png')
                : require('../assets/images/lockedBg.png')
            }
            resizeMode="stretch"
          >
            <View
              style={[
                puppBonStyles.puppBonCard,
                isSelected && unlocked && puppBonStyles.puppBonCardSelected,
              ]}
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
                      style={puppBonStyles.puppBonCardFlashBowl}
                      resizeMode="contain"
                    />
                  ) : null}

                  <Image
                    source={dog.image ?? require('../assets/images/dog1.png')}
                    style={puppBonStyles.puppBonDogImg}
                    resizeMode="contain"
                  />

                  <View style={puppBonStyles.puppBonBars}>
                    <View style={puppBonStyles.puppBonBarRow}>
                      <Image
                        source={require('../assets/images/foodbowl.png')}
                        style={puppBonStyles.puppBonFoodIcon}
                        resizeMode="contain"
                      />
                      <View style={puppBonStyles.puppBonBarBg}>
                        <View
                          style={[
                            puppBonStyles.puppBonBarFill,
                            { width: `${dog.hunger}%` },
                          ]}
                        />
                      </View>
                    </View>

                    <View style={puppBonStyles.puppBonBarRow}>
                      <Image
                        source={require('../assets/images/waterbowl.png')}
                        style={puppBonStyles.puppBonFoodIcon}
                        resizeMode="contain"
                      />
                      <View style={puppBonStyles.puppBonBarBg}>
                        <View
                          style={[
                            puppBonStyles.puppBonBarFill,
                            { width: `${dog.thirst}%` },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                </>
              ) : (
                <ImageBackground
                  source={require('../assets/images/smallButton.png')}
                  style={puppBonStyles.puppBonLockBtn}
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
        </AnimatedPressable>
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
  const [puppBonFoodCount, setPuppBonFoodCount] = useState(puppBonDefaultFood);
  const [puppBonWaterCount, setPuppBonWaterCount] =
    useState(puppBonDefaultWater);

  const [puppBonUnlockedDogs, setPuppBonUnlockedDogs] = useState<DogId[]>(
    () => [...puppBonDefaultUnlocked],
  );

  const [puppBonDogs, setPuppBonDogs] = useState<DogState[]>([
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

  const [puppBonSelectedDogId, setPuppBonSelectedDogId] =
    useState<DogId>('dog-1');
  const puppBonFoodShakeX = useRef(new Animated.Value(0)).current;
  const puppBonWaterShakeX = useRef(new Animated.Value(0)).current;
  const puppBonCardEntrance = useRef(
    puppBonDogs.map(() => new Animated.Value(0)),
  ).current;
  const [puppBonCardFlash, setPuppBonCardFlash] = useState<{
    dogId: DogId;
    kind: 'food' | 'water';
  } | null>(null);
  const puppBonFlashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const puppBonShowCardFlash = useCallback(
    (dogId: DogId, kind: 'food' | 'water') => {
      setPuppBonCardFlash({ dogId, kind });
      if (puppBonFlashTimeoutRef.current) {
        clearTimeout(puppBonFlashTimeoutRef.current);
      }
      puppBonFlashTimeoutRef.current = setTimeout(() => {
        setPuppBonCardFlash(null);
        puppBonFlashTimeoutRef.current = null;
      }, 1000);
    },
    [],
  );

  const puppBonRunShake = useCallback((value: Animated.Value) => {
    value.stopAnimation();
    value.setValue(0);
    Animated.sequence([
      Animated.timing(value, {
        toValue: -6 * puppBonS,
        duration: 45,
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 6 * puppBonS,
        duration: 45,
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: -4 * puppBonS,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 4 * puppBonS,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 0,
        duration: 35,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(
    () => () => {
      if (puppBonFlashTimeoutRef.current) {
        clearTimeout(puppBonFlashTimeoutRef.current);
      }
    },
    [],
  );

  const puppBonRunCardsEntrance = useCallback(() => {
    puppBonCardEntrance.forEach(v => v.setValue(0));
    Animated.stagger(
      120,
      puppBonCardEntrance.map(v =>
        Animated.timing(v, {
          toValue: 1,
          duration: 340,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [puppBonCardEntrance]);

  const puppBonLoadFromStorage = useCallback(async () => {
    try {
      const [puppBonF, puppBonWv, puppBonUd, puppBonEqRaw] = await Promise.all([
        AsyncStorage.getItem(puppBonStorageFoodCount),
        AsyncStorage.getItem(puppBonStorageWaterCount),
        AsyncStorage.getItem(puppBonStorageUnlockedDogs),
        AsyncStorage.getItem(puppBonStorageSkinEquipped),
      ]);

      const puppBonNextFood = puppBonEnsureNumber(puppBonF, puppBonDefaultFood);
      const puppBonNextWater = puppBonEnsureNumber(
        puppBonWv,
        puppBonDefaultWater,
      );
      const puppBonNextUnlocked = puppBonEnsureUnlocked(puppBonUd);
      const puppBonEquippedMap = puppBonEnsureEquipped(puppBonEqRaw);

      setPuppBonFoodCount(puppBonNextFood);
      setPuppBonWaterCount(puppBonNextWater);
      setPuppBonUnlockedDogs(puppBonNextUnlocked);
      setPuppBonDogs(prev =>
        prev.map(d => {
          const puppBonSkin: SkinId = puppBonEquippedMap[d.id] || 'base';
          const puppBonImageSource =
            puppBonHubDogSkins[d.id]?.[puppBonSkin] ??
            puppBonHubDogSkins[d.id]?.base ??
            d.image;
          return { ...d, image: puppBonImageSource };
        }),
      );

      if (puppBonF == null) {
        await AsyncStorage.setItem(
          puppBonStorageFoodCount,
          String(puppBonNextFood),
        );
      }
      if (puppBonWv == null) {
        await AsyncStorage.setItem(
          puppBonStorageWaterCount,
          String(puppBonNextWater),
        );
      }
      if (puppBonUd == null) {
        await AsyncStorage.setItem(
          puppBonStorageUnlockedDogs,
          JSON.stringify(puppBonNextUnlocked),
        );
      }

      if (!puppBonNextUnlocked.includes(puppBonSelectedDogId)) {
        setPuppBonSelectedDogId('dog-1');
      }
    } catch {
      setPuppBonFoodCount(puppBonDefaultFood);
      setPuppBonWaterCount(puppBonDefaultWater);
      setPuppBonUnlockedDogs([...puppBonDefaultUnlocked]);
    }
  }, [puppBonSelectedDogId]);

  useFocusEffect(
    useCallback(() => {
      puppBonLoadFromStorage();
      puppBonRunCardsEntrance();
    }, [puppBonLoadFromStorage, puppBonRunCardsEntrance]),
  );

  const puppBonSelectedDogIndex = useMemo(
    () => puppBonDogs.findIndex(d => d.id === puppBonSelectedDogId),
    [puppBonDogs, puppBonSelectedDogId],
  );

  const puppBonSelectedDog = useMemo(
    () =>
      puppBonSelectedDogIndex >= 0
        ? puppBonDogs[puppBonSelectedDogIndex]
        : null,
    [puppBonDogs, puppBonSelectedDogIndex],
  );

  const puppBonSelectDog = useCallback((id: DogId) => {
    setPuppBonSelectedDogId(id);
  }, []);

  const puppBonIsUnlocked = useCallback(
    (id: DogId) =>
      puppBonUnlockedDogs.includes(id) || id === 'dog-1' || id === 'dog-2',
    [puppBonUnlockedDogs],
  );

  const puppBonFeedSelectedDog = useCallback(() => {
    if (!puppBonSelectedDog) return;
    if (!puppBonIsUnlocked(puppBonSelectedDog.id)) return;

    setPuppBonFoodCount(c => {
      if (c <= 0) {
        puppBonRunShake(puppBonFoodShakeX);
        return c;
      }

      const puppBonNext = c - 1;
      AsyncStorage.setItem(puppBonStorageFoodCount, String(puppBonNext));
      puppBonShowCardFlash(puppBonSelectedDog.id, 'food');

      setPuppBonDogs(prev =>
        prev.map(d =>
          d.id === puppBonSelectedDog.id
            ? {
                ...d,
                hunger: puppBonClamp(d.hunger + 20, 0, 100),
              }
            : d,
        ),
      );

      return puppBonNext;
    });
  }, [
    puppBonFoodShakeX,
    puppBonIsUnlocked,
    puppBonRunShake,
    puppBonSelectedDog,
    puppBonShowCardFlash,
  ]);

  const puppBonWaterSelectedDog = useCallback(() => {
    if (!puppBonSelectedDog) return;
    if (!puppBonIsUnlocked(puppBonSelectedDog.id)) return;

    setPuppBonWaterCount(c => {
      if (c <= 0) {
        puppBonRunShake(puppBonWaterShakeX);
        return c;
      }

      const puppBonNext = c - 1;
      AsyncStorage.setItem(puppBonStorageWaterCount, String(puppBonNext));
      puppBonShowCardFlash(puppBonSelectedDog.id, 'water');

      setPuppBonDogs(prev =>
        prev.map(d =>
          d.id === puppBonSelectedDog.id
            ? {
                ...d,
                thirst: puppBonClamp(d.thirst + 20, 0, 100),
              }
            : d,
        ),
      );

      return puppBonNext;
    });
  }, [
    puppBonIsUnlocked,
    puppBonRunShake,
    puppBonSelectedDog,
    puppBonShowCardFlash,
    puppBonWaterShakeX,
  ]);

  return (
    <Layout>
      <View
        style={{
          flex: 1,
          paddingBottom: 120,
        }}
      >
        <ImageBackground
          source={require('../assets/images/smallHead.png')}
          style={puppBonStyles.puppBonHeader}
          resizeMode="stretch"
        >
          <Text style={puppBonStyles.puppBonHeaderText}>Home</Text>
        </ImageBackground>

        <View style={puppBonStyles.puppBonTopCounters}>
          <Animated.View
            style={{ transform: [{ translateX: puppBonFoodShakeX }] }}
          >
            <AnimatedPressable
              activeOpacity={0.85}
              onPress={puppBonFeedSelectedDog}
            >
              <ImageBackground
                source={require('../assets/images/smallButton.png')}
                style={puppBonStyles.puppBonCounterFrame}
                resizeMode="stretch"
              >
                <Text style={puppBonStyles.puppBonCounterText}>
                  {puppBonFoodCount}
                </Text>
                <Image
                  source={require('../assets/images/foodbowl.png')}
                  style={puppBonStyles.puppBonCounterIcon}
                  resizeMode="contain"
                />
              </ImageBackground>
            </AnimatedPressable>
          </Animated.View>

          <Animated.View
            style={{ transform: [{ translateX: puppBonWaterShakeX }] }}
          >
            <AnimatedPressable
              activeOpacity={0.85}
              onPress={puppBonWaterSelectedDog}
            >
              <ImageBackground
                source={require('../assets/images/smallButton.png')}
                style={puppBonStyles.puppBonCounterFrame}
                resizeMode="stretch"
              >
                <Text style={puppBonStyles.puppBonCounterText}>
                  {puppBonWaterCount}
                </Text>
                <Image
                  source={require('../assets/images/waterbowl.png')}
                  style={puppBonStyles.puppBonCounterIcon}
                  resizeMode="contain"
                />
              </ImageBackground>
            </AnimatedPressable>
          </Animated.View>
        </View>

        <View style={puppBonStyles.puppBonGrid}>
          {puppBonDogs.map((dog, i) => (
            <Animated.View
              key={dog.id}
              style={{
                opacity: puppBonCardEntrance[i],
                transform: [
                  {
                    translateY: puppBonCardEntrance[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                ],
              }}
            >
              <DogCard
                dog={dog}
                unlocked={puppBonIsUnlocked(dog.id)}
                index={i}
                isSelected={dog.id === puppBonSelectedDogId}
                flashKind={
                  puppBonCardFlash && puppBonCardFlash.dogId === dog.id
                    ? puppBonCardFlash.kind
                    : null
                }
                onPress={puppBonSelectDog}
              />
            </Animated.View>
          ))}
        </View>
      </View>
    </Layout>
  );
};

export default HomeScreen;

const puppBonStyles = StyleSheet.create({
  puppBonHeader: {
    alignSelf: 'center',
    marginTop: 40 * puppBonS,
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
  puppBonTopCounters: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 18 * puppBonS,
    marginTop: 14 * puppBonS,
  },
  puppBonCounterFrame: {
    width: 71 * puppBonS,
    height: 71 * puppBonS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  puppBonCounterText: {
    position: 'absolute',
    top: 8 * puppBonS,
    fontSize: 14 * puppBonS,
    color: '#59173E',
    fontFamily: 'Kanit-SemiBold',
  },
  puppBonCounterIcon: {
    width: 34 * puppBonS,
    height: 34 * puppBonS,
    marginTop: 10 * puppBonS,
  },
  puppBonGrid: {
    alignSelf: 'center',
    marginTop: 10 * puppBonS,
    width: 340 * puppBonS,
    height: 510 * puppBonS,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    paddingVertical: 10 * puppBonS,
  },
  puppBonCardWrap: {
    width: 160 * puppBonS,
    height: 220 * puppBonS,
  },
  puppBonCardBg: {
    width: 160 * puppBonS,
    height: 160 * puppBonS,
    justifyContent: 'flex-start',
  },
  puppBonCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  puppBonCardFlashBowl: {
    position: 'absolute',
    top: 12 * puppBonS,
    right: 12 * puppBonS,
    width: 28 * puppBonS,
    height: 28 * puppBonS,
    zIndex: 3,
  },
  puppBonCardSelected: {
    borderColor: '#2b74ff',
  },
  puppBonDogImg: {
    width: 81 * puppBonS,
    height: 106 * puppBonS,
    position: 'absolute',
    top: 50,
    zIndex: 2,
    right: 20,
  },
  puppBonBars: {
    width: '88%',
    gap: 6 * puppBonS,
    position: 'absolute',
    top: 170 * puppBonS,
  },
  puppBonBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7 * puppBonS,
  },
  puppBonFoodIcon: {
    width: 24,
    height: 24,
  },
  puppBonBarBg: {
    flex: 1,
    height: 10 * puppBonS,
    borderRadius: 999,
    backgroundColor: 'rgb(253, 253, 253)',
    overflow: 'hidden',
  },
  puppBonBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#59173E',
  },
  puppBonLockBtn: {
    width: 71,
    height: 71,
    justifyContent: 'center',
    alignItems: 'center',
  },
  puppBonBottomBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8 * puppBonS,
    flex: 1,
    marginBottom: 20 * puppBonS,
    flexWrap: 'wrap',
    marginTop: 20 * puppBonS,
  },
  puppBonBottomSmallBtn: {
    width: 70 * puppBonS,
    height: 70 * puppBonS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  puppBonBottomIcon: {
    width: 32 * puppBonS,
    height: 32 * puppBonS,
    bottom: 2 * puppBonS,
  },
  puppBonBottomCenter: {
    width: 210 * puppBonS,
    height: 70 * puppBonS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  puppBonBottomText: {
    fontSize: 22 * puppBonS,
    color: '#fff',
    fontFamily: 'Kanit-SemiBold',
    marginTop: -2 * puppBonS,
  },
});
