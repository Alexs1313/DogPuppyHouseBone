import { useFocusEffect, useNavigation } from '@react-navigation/native';

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

import AsyncStorage from '@react-native-async-storage/async-storage';
import Layout from '../Dgppyhuseboncmpnts/Layout';
import LinearGradient from 'react-native-linear-gradient';

const { width: puppBonW, height: puppBonH } = Dimensions.get('window');
const puppBonIsLandscape = puppBonW > puppBonH;

const puppBonS = puppBonIsLandscape
  ? puppBonW / 844
  : Math.min(puppBonW / 390, puppBonH / 844);

const puppBonStorageTotalBones = 'TOTAL_BONES';
const puppBonDefaultBones = 50;
const puppBonStorageFoodCount = 'FOOD_COUNT';
const puppBonStorageWaterCount = 'WATER_COUNT';
const puppBonStorageUnlockedDogs = 'UNLOCKED_DOGS';

const puppBonPriceFeed = 3;
const puppBonPriceWater = 3;

type Tab = 'products' | 'dogs';

type DogShopItem = {
  id: string;
  name: string;
  price: number;
  image: any;
};

const puppBonDogs: DogShopItem[] = [
  {
    id: 'dog-1',
    name: 'Pug',
    price: 0,
    image: require('../assets/images/dog1.png'),
  },
  {
    id: 'dog-2',
    name: 'Beagle',
    price: 150,
    image: require('../assets/images/dog2.png'),
  },
  {
    id: 'dog-3',
    name: 'Maltese',
    price: 200,
    image: require('../assets/images/dog3.png'),
  },
  {
    id: 'dog-4',
    name: 'Rottweiler',
    price: 300,
    image: require('../assets/images/dog4.png'),
  },
];

const puppBonPad3 = (n: number) => String(n).padStart(3, '0');

const MarketScreen: React.FC<{ onClose?: () => void }> = () => {
  const [puppBonTab, setPuppBonTab] = useState<Tab>('products');

  const [puppBonBones, setPuppBonBones] = useState<number>(puppBonDefaultBones);
  const [puppBonFoodCount, setPuppBonFoodCount] = useState<number>(0);
  const [puppBonWaterCount, setPuppBonWaterCount] = useState<number>(0);

  const [puppBonUnlockedDogs, setPuppBonUnlockedDogs] = useState<string[]>([
    'dog-1',
  ]);
  const [puppBonDogIndex, setPuppBonDogIndex] = useState(0);
  const puppBonNavigation = useNavigation();
  const puppBonFoodShakeX = useRef(new Animated.Value(0)).current;
  const puppBonWaterShakeX = useRef(new Animated.Value(0)).current;
  const puppBonDogShakeX = useRef(new Animated.Value(0)).current;
  const puppBonProductsEntrance = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const puppBonDogsEntrance = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const puppBonActiveDog = useMemo(
    () => puppBonDogs[puppBonDogIndex],
    [puppBonDogIndex],
  );
  const puppBonIsUnlocked = useMemo(
    () =>
      puppBonUnlockedDogs.includes(puppBonActiveDog.id) ||
      puppBonActiveDog.price === 0,
    [puppBonActiveDog.id, puppBonActiveDog.price, puppBonUnlockedDogs],
  );

  const puppBonLoadFromStorage = useCallback(async () => {
    try {
      const [puppBonB, puppBonF, puppBonWv, puppBonUd] = await Promise.all([
        AsyncStorage.getItem(puppBonStorageTotalBones),
        AsyncStorage.getItem(puppBonStorageFoodCount),
        AsyncStorage.getItem(puppBonStorageWaterCount),
        AsyncStorage.getItem(puppBonStorageUnlockedDogs),
      ]);

      const puppBonBonesVal = puppBonB ? Number(puppBonB) : null;
      const puppBonNextBones =
        puppBonBonesVal != null && Number.isFinite(puppBonBonesVal)
          ? puppBonBonesVal
          : puppBonDefaultBones;

      setPuppBonBones(puppBonNextBones);

      if (puppBonB == null) {
        await AsyncStorage.setItem(
          puppBonStorageTotalBones,
          String(puppBonNextBones),
        );
      }

      setPuppBonFoodCount(puppBonF ? Number(puppBonF) || 0 : 0);
      setPuppBonWaterCount(puppBonWv ? Number(puppBonWv) || 0 : 0);

      const puppBonParsed = puppBonUd
        ? (JSON.parse(puppBonUd) as string[])
        : ['dog-1'];

      if (Array.isArray(puppBonParsed) && puppBonParsed.length) {
        setPuppBonUnlockedDogs(puppBonParsed);
      } else {
        setPuppBonUnlockedDogs(['dog-1']);
      }
    } catch {
      setPuppBonBones(puppBonDefaultBones);
      setPuppBonFoodCount(0);
      setPuppBonWaterCount(0);
      setPuppBonUnlockedDogs(['dog-1']);
    }
  }, []);

  useEffect(() => {
    puppBonLoadFromStorage();
  }, [puppBonLoadFromStorage]);

  useFocusEffect(
    useCallback(() => {
      puppBonLoadFromStorage();
    }, [puppBonLoadFromStorage]),
  );

  const puppBonSaveBones = useCallback(async (next: number) => {
    setPuppBonBones(next);
    await AsyncStorage.setItem(puppBonStorageTotalBones, String(next));
  }, []);

  const puppBonSaveFood = useCallback(async (next: number) => {
    setPuppBonFoodCount(next);
    await AsyncStorage.setItem(puppBonStorageFoodCount, String(next));
  }, []);

  const puppBonSaveWater = useCallback(async (next: number) => {
    setPuppBonWaterCount(next);
    await AsyncStorage.setItem(puppBonStorageWaterCount, String(next));
  }, []);

  const puppBonSaveUnlocked = useCallback(async (next: string[]) => {
    setPuppBonUnlockedDogs(next);
    await AsyncStorage.setItem(
      puppBonStorageUnlockedDogs,
      JSON.stringify(next),
    );
  }, []);

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

  const puppBonBuyFood = useCallback(async () => {
    if (puppBonBones < puppBonPriceFeed) {
      puppBonRunShake(puppBonFoodShakeX);
      return;
    }
    const puppBonNextBones = puppBonBones - puppBonPriceFeed;
    const puppBonNextFood = puppBonFoodCount + 1;
    await Promise.all([
      puppBonSaveBones(puppBonNextBones),
      puppBonSaveFood(puppBonNextFood),
    ]);
  }, [
    puppBonBones,
    puppBonFoodCount,
    puppBonFoodShakeX,
    puppBonRunShake,
    puppBonSaveBones,
    puppBonSaveFood,
  ]);

  const puppBonBuyWater = useCallback(async () => {
    if (puppBonBones < puppBonPriceWater) {
      puppBonRunShake(puppBonWaterShakeX);
      return;
    }
    const puppBonNextBones = puppBonBones - puppBonPriceWater;
    const puppBonNextWater = puppBonWaterCount + 1;
    await Promise.all([
      puppBonSaveBones(puppBonNextBones),
      puppBonSaveWater(puppBonNextWater),
    ]);
  }, [
    puppBonBones,
    puppBonRunShake,
    puppBonSaveBones,
    puppBonSaveWater,
    puppBonWaterCount,
    puppBonWaterShakeX,
  ]);

  const puppBonBuyDog = useCallback(async () => {
    if (puppBonIsUnlocked) return;

    if (puppBonBones < puppBonActiveDog.price) {
      puppBonRunShake(puppBonDogShakeX);
      return;
    }

    const puppBonNextBones = puppBonBones - puppBonActiveDog.price;
    const puppBonNextUnlocked = Array.from(
      new Set([...puppBonUnlockedDogs, puppBonActiveDog.id]),
    );

    await Promise.all([
      puppBonSaveBones(puppBonNextBones),
      puppBonSaveUnlocked(puppBonNextUnlocked),
    ]);
  }, [
    puppBonActiveDog.id,
    puppBonActiveDog.price,
    puppBonBones,
    puppBonDogShakeX,
    puppBonIsUnlocked,
    puppBonRunShake,
    puppBonSaveBones,
    puppBonSaveUnlocked,
    puppBonUnlockedDogs,
  ]);

  const puppBonPrevDog = useCallback(() => {
    setPuppBonDogIndex(i => (i - 1 + puppBonDogs.length) % puppBonDogs.length);
  }, []);
  const puppBonNextDog = useCallback(() => {
    setPuppBonDogIndex(i => (i + 1) % puppBonDogs.length);
  }, []);

  const puppBonRunMarketEntrance = useCallback(() => {
    const puppBonValues =
      puppBonTab === 'products' ? puppBonProductsEntrance : puppBonDogsEntrance;

    puppBonValues.forEach(v => v.setValue(0));

    Animated.stagger(
      130,
      puppBonValues.map(v =>
        Animated.timing(v, {
          toValue: 1,
          duration: 340,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [puppBonDogsEntrance, puppBonProductsEntrance, puppBonTab]);

  useFocusEffect(
    useCallback(() => {
      puppBonRunMarketEntrance();
    }, [puppBonRunMarketEntrance]),
  );

  useEffect(() => {
    puppBonRunMarketEntrance();
  }, [puppBonRunMarketEntrance, puppBonTab]);

  const puppBonImgHeader = require('../assets/images/smallHead.png');
  const puppBonImgSmallBtn = require('../assets/images/smallButton.png');
  const puppBonImgScoreBoard = require('../assets/images/scoreboard.png');
  const puppBonImgBone = require('../assets/images/bone.png');

  const puppBonImgArrowLeft = require('../assets/images/arrow_left.png');
  const puppBonImgArrowRight = require('../assets/images/arrow_right.png');
  const puppBonImgFoodIcon = require('../assets/images/foodbowl.png');
  const puppBonImgWaterIcon = require('../assets/images/waterbowl.png');

  const puppBonImgTabProducts = require('../assets/images/mainbutton.png');
  const puppBonImgTabDogs = require('../assets/images/mainbutton.png');

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
            <Text style={puppBonStyles.puppBonHeaderText}>Market</Text>
          </ImageBackground>
        </View>

        <ImageBackground
          source={puppBonImgScoreBoard}
          style={puppBonStyles.puppBonBalanceBoard}
          resizeMode="stretch"
        >
          <Image
            source={puppBonImgBone}
            style={puppBonStyles.puppBonBalanceBone}
            resizeMode="contain"
          />
          <Text style={puppBonStyles.puppBonBalanceText}>
            {puppBonPad3(puppBonBones)}
          </Text>
        </ImageBackground>

        <View style={puppBonStyles.puppBonTabsRow}>
          <AnimatedPressable
            activeOpacity={0.85}
            onPress={() => setPuppBonTab('products')}
          >
            <ImageBackground
              source={puppBonImgTabProducts}
              style={[
                puppBonStyles.puppBonTabBtn,
                puppBonTab === 'products'
                  ? puppBonStyles.puppBonTabActive
                  : puppBonStyles.puppBonTabInactive,
              ]}
              resizeMode="stretch"
            >
              <Text
                style={[
                  puppBonStyles.puppBonTabText,
                  puppBonTab === 'products'
                    ? puppBonStyles.puppBonTabTextActive
                    : puppBonStyles.puppBonTabTextInactive,
                ]}
              >
                Products
              </Text>
            </ImageBackground>
          </AnimatedPressable>

          <AnimatedPressable
            activeOpacity={0.85}
            onPress={() => setPuppBonTab('dogs')}
          >
            <ImageBackground
              source={puppBonImgTabDogs}
              style={[
                puppBonStyles.puppBonTabBtn,
                puppBonTab === 'dogs'
                  ? puppBonStyles.puppBonTabActive
                  : puppBonStyles.puppBonTabInactive,
              ]}
              resizeMode="stretch"
            >
              <Text
                style={[
                  puppBonStyles.puppBonTabText,
                  puppBonTab === 'dogs'
                    ? puppBonStyles.puppBonTabTextActive
                    : puppBonStyles.puppBonTabTextInactive,
                ]}
              >
                Dogs
              </Text>
            </ImageBackground>
          </AnimatedPressable>
        </View>

        {puppBonTab === 'dogs' ? (
          <View style={puppBonStyles.puppBonDogsWrap}>
            <Animated.View
              style={{
                opacity: puppBonDogsEntrance[0],
                transform: [
                  {
                    translateY: puppBonDogsEntrance[0].interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                ],
              }}
            >
              <View style={puppBonStyles.puppBonCardOuter}>
                <LinearGradient
                  colors={['#EB924D', '#963B34']}
                  style={{ borderRadius: 19 * puppBonS }}
                >
                  <View style={puppBonStyles.puppBonCardBg}>
                    <Image
                      source={puppBonActiveDog.image}
                      style={puppBonStyles.puppBonDogImage}
                      resizeMode="contain"
                    />

                    <Image
                      source={require('../assets/images/markehouse.png')}
                      style={{
                        position: 'absolute',
                      }}
                    />
                  </View>
                </LinearGradient>
              </View>
            </Animated.View>

            <Animated.View
              style={{
                opacity: puppBonDogsEntrance[1],
                transform: [
                  {
                    translateY: puppBonDogsEntrance[1].interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                ],
              }}
            >
              <View style={puppBonStyles.puppBonPriceRow}>
                <AnimatedPressable
                  activeOpacity={0.85}
                  onPress={puppBonPrevDog}
                >
                  <ImageBackground
                    source={puppBonImgSmallBtn}
                    style={puppBonStyles.puppBonArrowBtn}
                    resizeMode="stretch"
                  >
                    {puppBonImgArrowLeft ? (
                      <Image
                        source={puppBonImgArrowRight}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={puppBonStyles.puppBonArrowText}>←</Text>
                    )}
                  </ImageBackground>
                </AnimatedPressable>

                <Animated.View
                  style={{ transform: [{ translateX: puppBonDogShakeX }] }}
                >
                  <AnimatedPressable
                    activeOpacity={0.85}
                    onPress={puppBonBuyDog}
                    disabled={puppBonIsUnlocked || puppBonActiveDog.price === 0}
                  >
                    <ImageBackground
                      source={require('../assets/images/mainbutton.png')}
                      style={puppBonStyles.puppBonBuyBoard}
                      resizeMode="stretch"
                    >
                      {puppBonIsUnlocked ? (
                        <Text style={puppBonStyles.puppBonBuyText}>
                          Received
                        </Text>
                      ) : (
                        <View style={puppBonStyles.puppBonPriceInline}>
                          <Image
                            source={puppBonImgBone}
                            style={puppBonStyles.puppBonPriceBone}
                            resizeMode="contain"
                          />
                          <Text style={puppBonStyles.puppBonBuyText}>
                            {puppBonActiveDog.price}
                          </Text>
                        </View>
                      )}
                    </ImageBackground>
                  </AnimatedPressable>
                </Animated.View>

                <AnimatedPressable
                  activeOpacity={0.85}
                  onPress={puppBonNextDog}
                >
                  <ImageBackground
                    source={puppBonImgSmallBtn}
                    style={puppBonStyles.puppBonArrowBtn}
                    resizeMode="stretch"
                  >
                    {puppBonImgArrowRight ? (
                      <Image
                        source={puppBonImgArrowLeft}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={puppBonStyles.puppBonArrowText}>→</Text>
                    )}
                  </ImageBackground>
                </AnimatedPressable>
              </View>
            </Animated.View>
          </View>
        ) : (
          <View style={puppBonStyles.puppBonProductsWrap}>
            <Animated.View
              style={{
                opacity: puppBonProductsEntrance[0],
                transform: [
                  {
                    translateY: puppBonProductsEntrance[0].interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                ],
              }}
            >
              <LinearGradient
                colors={['#EB924D', '#963B34']}
                style={{
                  borderWidth: 1,
                  borderColor: '#59173E',
                  borderRadius: 12 * puppBonS,
                }}
              >
                <View style={puppBonStyles.puppBonProductRow}>
                  <ImageBackground
                    source={puppBonImgSmallBtn}
                    style={puppBonStyles.puppBonProductIconBox}
                    resizeMode="stretch"
                  >
                    <Image
                      source={puppBonImgFoodIcon}
                      style={puppBonStyles.puppBonProductIcon}
                      resizeMode="contain"
                    />
                  </ImageBackground>

                  <Text style={puppBonStyles.puppBonProductTitle}>Feed</Text>

                  <Animated.View
                    style={{ transform: [{ translateX: puppBonFoodShakeX }] }}
                  >
                    <AnimatedPressable
                      activeOpacity={0.85}
                      onPress={puppBonBuyFood}
                    >
                      <ImageBackground
                        source={require('../assets/images/scoreboard.png')}
                        style={puppBonStyles.puppBonProductPrice}
                        resizeMode="stretch"
                      >
                        <Image
                          source={puppBonImgBone}
                          style={puppBonStyles.puppBonPriceBoneSmall}
                          resizeMode="contain"
                        />
                        <Text style={puppBonStyles.puppBonProductPriceText}>
                          {puppBonPad3(puppBonPriceFeed)}
                        </Text>
                      </ImageBackground>
                    </AnimatedPressable>
                  </Animated.View>
                </View>
              </LinearGradient>
            </Animated.View>

            <Animated.View
              style={{
                opacity: puppBonProductsEntrance[1],
                transform: [
                  {
                    translateY: puppBonProductsEntrance[1].interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                ],
              }}
            >
              <LinearGradient
                colors={['#EB924D', '#963B34']}
                style={{
                  borderWidth: 1,
                  borderColor: '#59173E',
                  borderRadius: 12 * puppBonS,
                }}
              >
                <View style={puppBonStyles.puppBonProductRow}>
                  <ImageBackground
                    source={puppBonImgSmallBtn}
                    style={puppBonStyles.puppBonProductIconBox}
                    resizeMode="stretch"
                  >
                    <Image
                      source={puppBonImgWaterIcon}
                      style={puppBonStyles.puppBonProductIcon}
                      resizeMode="contain"
                    />
                  </ImageBackground>

                  <Text style={puppBonStyles.puppBonProductTitle}>Water</Text>

                  <Animated.View
                    style={{ transform: [{ translateX: puppBonWaterShakeX }] }}
                  >
                    <AnimatedPressable
                      activeOpacity={0.85}
                      onPress={puppBonBuyWater}
                    >
                      <ImageBackground
                        source={require('../assets/images/scoreboard.png')}
                        style={puppBonStyles.puppBonProductPrice}
                        resizeMode="stretch"
                      >
                        <Image
                          source={puppBonImgBone}
                          style={puppBonStyles.puppBonPriceBoneSmall}
                          resizeMode="contain"
                        />
                        <Text style={puppBonStyles.puppBonProductPriceText}>
                          {puppBonPad3(puppBonPriceWater)}
                        </Text>
                      </ImageBackground>
                    </AnimatedPressable>
                  </Animated.View>
                </View>
              </LinearGradient>
            </Animated.View>
          </View>
        )}
      </View>
    </Layout>
  );
};

export default MarketScreen;

const puppBonStyles = StyleSheet.create({
  puppBonScreen: { flex: 1 },
  puppBonCloseBtnBg: {
    width: 71 * puppBonS,
    height: 71 * puppBonS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  puppBonCloseText: {
    marginTop: -4 * puppBonS,
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
  puppBonBalanceBoard: {
    alignSelf: 'center',
    marginTop: 6 * puppBonS,
    width: 166 * puppBonS,
    height: 60 * puppBonS,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10 * puppBonS,
    marginBottom: 20,
  },
  puppBonBalanceBone: {
    width: 44 * puppBonS,
    height: 44 * puppBonS,
  },
  puppBonBalanceText: {
    fontSize: 21 * puppBonS,
    color: '#fff',
    fontFamily: 'Kanit-Medium',
  },
  puppBonDogsWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18 * puppBonS,
    marginTop: 20,
  },
  puppBonCardOuter: {
    width: 290 * puppBonS,
    height: 290 * puppBonS,
    borderRadius: 20 * puppBonS,
    borderWidth: 2,
    borderColor: '#59173E',
  },
  puppBonCardBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  puppBonDogImage: {
    width: 136,
    height: 170,
    zIndex: 2,
    right: -50,
  },
  puppBonPriceRow: {
    marginTop: 18 * puppBonS,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5 * puppBonS,
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
  puppBonBuyBoard: {
    width: 180 * puppBonS,
    height: 70 * puppBonS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  puppBonBuyText: {
    fontSize: 22 * puppBonS,
    color: '#fff',
    fontFamily: 'Kanit-SemiBold',
    marginTop: -2 * puppBonS,
  },
  puppBonPriceInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10 * puppBonS,
  },
  puppBonPriceBone: {
    width: 34 * puppBonS,
    height: 24 * puppBonS,
  },
  puppBonProductsWrap: {
    paddingHorizontal: 18 * puppBonS,
    justifyContent: 'center',
    gap: 52 * puppBonS,
    marginTop: 50,
  },
  puppBonProductRow: {
    width: '100%',
    height: 92 * puppBonS,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14 * puppBonS,
    justifyContent: 'space-between',
  },
  puppBonProductIconBox: {
    width: 64 * puppBonS,
    height: 64 * puppBonS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  puppBonProductIcon: {
    width: 40 * puppBonS,
    height: 40 * puppBonS,
  },
  puppBonProductTitle: {
    flex: 1,
    marginLeft: 14 * puppBonS,
    fontSize: 22 * puppBonS,
    color: '#fff',
    fontFamily: 'Kanit-SemiBold',
  },
  puppBonProductPrice: {
    width: 120 * puppBonS,
    height: 52 * puppBonS,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8 * puppBonS,
  },
  puppBonPriceBoneSmall: {
    width: 26 * puppBonS,
    height: 18 * puppBonS,
  },
  puppBonProductPriceText: {
    fontSize: 20 * puppBonS,
    color: '#fff',
    fontFamily: 'Kanit-SemiBold',
  },
  puppBonOwnedRow: {
    alignItems: 'center',
    marginTop: 6 * puppBonS,
  },
  puppBonOwnedText: {
    fontSize: 14 * puppBonS,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Kanit-SemiBold',
  },
  puppBonTabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18 * puppBonS,
    gap: 14 * puppBonS,
    marginTop: 2,
  },
  puppBonTabBtn: {
    width: (puppBonW - 72 * puppBonS) / 2,
    height: 64 * puppBonS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  puppBonTabActive: {
    opacity: 1,
  },
  puppBonTabInactive: {
    opacity: 0.9,
  },
  puppBonTabText: {
    fontSize: 20 * puppBonS,
    fontFamily: 'Kanit-SemiBold',
    marginTop: -2 * puppBonS,
  },
  puppBonTabTextActive: {
    color: '#fff',
  },
  puppBonTabTextInactive: {
    color: '#59173E',
  },
});
