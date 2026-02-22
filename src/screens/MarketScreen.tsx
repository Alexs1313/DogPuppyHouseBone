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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Layout from '../components/Layout';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const { width: W, height: H } = Dimensions.get('window');
const isLandscape = W > H;

const s = isLandscape ? W / 844 : Math.min(W / 390, H / 844);

const STORAGE_TOTAL_BONES = 'TOTAL_BONES';
const STORAGE_FOOD_COUNT = 'FOOD_COUNT';
const STORAGE_WATER_COUNT = 'WATER_COUNT';
const STORAGE_UNLOCKED_DOGS = 'UNLOCKED_DOGS';

const PRICE_FEED = 3;
const PRICE_WATER = 3;

type Tab = 'products' | 'dogs';

type DogShopItem = {
  id: string;
  name: string;
  price: number;
  image: any;
};

const DOGS: DogShopItem[] = [
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

const pad3 = (n: number) => String(n).padStart(3, '0');

const MarketScreen: React.FC<{ onClose?: () => void }> = () => {
  const [tab, setTab] = useState<Tab>('products');

  const [bones, setBones] = useState<number>(0);
  const [foodCount, setFoodCount] = useState<number>(0);
  const [waterCount, setWaterCount] = useState<number>(0);

  const [unlockedDogs, setUnlockedDogs] = useState<string[]>(['dog-1']);
  const [dogIndex, setDogIndex] = useState(0);
  const navigation = useNavigation();
  const foodShakeX = useRef(new Animated.Value(0)).current;
  const waterShakeX = useRef(new Animated.Value(0)).current;
  const dogShakeX = useRef(new Animated.Value(0)).current;

  const activeDog = useMemo(() => DOGS[dogIndex], [dogIndex]);
  const isUnlocked = useMemo(
    () => unlockedDogs.includes(activeDog.id) || activeDog.price === 0,
    [activeDog.id, activeDog.price, unlockedDogs],
  );

  useEffect(() => {
    (async () => {
      try {
        const [b, f, w, ud] = await Promise.all([
          AsyncStorage.getItem(STORAGE_TOTAL_BONES),
          AsyncStorage.getItem(STORAGE_FOOD_COUNT),
          AsyncStorage.getItem(STORAGE_WATER_COUNT),
          AsyncStorage.getItem(STORAGE_UNLOCKED_DOGS),
        ]);

        setBones(b ? Number(b) || 0 : 0);
        setFoodCount(f ? Number(f) || 0 : 0);
        setWaterCount(w ? Number(w) || 0 : 0);

        const parsed = ud ? (JSON.parse(ud) as string[]) : ['dog-1'];
        if (Array.isArray(parsed) && parsed.length) setUnlockedDogs(parsed);
        else setUnlockedDogs(['dog-1']);
      } catch {
        setBones(0);
        setFoodCount(0);
        setWaterCount(0);
        setUnlockedDogs(['dog-1']);
      }
    })();
  }, []);

  const saveBones = useCallback(async (next: number) => {
    setBones(next);
    await AsyncStorage.setItem(STORAGE_TOTAL_BONES, String(next));
  }, []);

  const saveFood = useCallback(async (next: number) => {
    setFoodCount(next);
    await AsyncStorage.setItem(STORAGE_FOOD_COUNT, String(next));
  }, []);

  const saveWater = useCallback(async (next: number) => {
    setWaterCount(next);
    await AsyncStorage.setItem(STORAGE_WATER_COUNT, String(next));
  }, []);

  const saveUnlocked = useCallback(async (next: string[]) => {
    setUnlockedDogs(next);
    await AsyncStorage.setItem(STORAGE_UNLOCKED_DOGS, JSON.stringify(next));
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

  const buyFood = useCallback(async () => {
    if (bones < PRICE_FEED) {
      runShake(foodShakeX);
      return;
    }
    const nextBones = bones - PRICE_FEED;
    const nextFood = foodCount + 1;
    await Promise.all([saveBones(nextBones), saveFood(nextFood)]);
  }, [bones, foodCount, foodShakeX, runShake, saveBones, saveFood]);

  const buyWater = useCallback(async () => {
    if (bones < PRICE_WATER) {
      runShake(waterShakeX);
      return;
    }
    const nextBones = bones - PRICE_WATER;
    const nextWater = waterCount + 1;
    await Promise.all([saveBones(nextBones), saveWater(nextWater)]);
  }, [bones, runShake, saveBones, saveWater, waterCount, waterShakeX]);

  const buyDog = useCallback(async () => {
    if (isUnlocked) return;

    if (bones < activeDog.price) {
      runShake(dogShakeX);
      return;
    }

    const nextBones = bones - activeDog.price;
    const nextUnlocked = Array.from(new Set([...unlockedDogs, activeDog.id]));

    await Promise.all([saveBones(nextBones), saveUnlocked(nextUnlocked)]);
  }, [
    activeDog.id,
    activeDog.price,
    bones,
    dogShakeX,
    isUnlocked,
    runShake,
    saveBones,
    saveUnlocked,
    unlockedDogs,
  ]);

  const prevDog = useCallback(() => {
    setDogIndex(i => (i - 1 + DOGS.length) % DOGS.length);
  }, []);
  const nextDog = useCallback(() => {
    setDogIndex(i => (i + 1) % DOGS.length);
  }, []);

  const imgHeader = require('../assets/images/smallHead.png');
  const imgSmallBtn = require('../assets/images/smallButton.png');
  const imgScoreBoard = require('../assets/images/scoreboard.png');
  const imgBone = require('../assets/images/bone.png');

  const imgArrowLeft = require('../assets/images/arrow_left.png');
  const imgArrowRight = require('../assets/images/arrow_right.png');
  const imgFoodIcon = require('../assets/images/foodbowl.png');
  const imgWaterIcon = require('../assets/images/waterbowl.png');

  const imgTabProducts = require('../assets/images/mainbutton.png');
  const imgTabDogs = require('../assets/images/mainbutton.png');

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
              <Image
                source={require('../assets/images/close.png')}
                style={styles.closeText}
              />
            </ImageBackground>
          </TouchableOpacity>

          <ImageBackground
            source={imgHeader}
            style={styles.header}
            resizeMode="stretch"
          >
            <Text style={styles.headerText}>Market</Text>
          </ImageBackground>
        </View>

        <ImageBackground
          source={imgScoreBoard}
          style={styles.balanceBoard}
          resizeMode="stretch"
        >
          <Image
            source={imgBone}
            style={styles.balanceBone}
            resizeMode="contain"
          />
          <Text style={styles.balanceText}>{pad3(bones)}</Text>
        </ImageBackground>

        {tab === 'dogs' ? (
          <View style={styles.dogsWrap}>
            <View style={styles.cardOuter}>
              <LinearGradient
                colors={['#EB924D', '#963B34']}
                style={{ borderRadius: 19 * s }}
              >
                <View style={styles.cardBg}>
                  <Image
                    source={activeDog.image}
                    style={styles.dogImage}
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

            <View style={styles.priceRow}>
              <TouchableOpacity activeOpacity={0.85} onPress={prevDog}>
                <ImageBackground
                  source={imgSmallBtn}
                  style={styles.arrowBtn}
                  resizeMode="stretch"
                >
                  {imgArrowLeft ? (
                    <Image source={imgArrowRight} resizeMode="contain" />
                  ) : (
                    <Text style={styles.arrowText}>←</Text>
                  )}
                </ImageBackground>
              </TouchableOpacity>

              <Animated.View style={{ transform: [{ translateX: dogShakeX }] }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={buyDog}
                  disabled={isUnlocked || activeDog.price === 0}
                >
                  <ImageBackground
                    source={require('../assets/images/mainbutton.png')}
                    style={styles.buyBoard}
                    resizeMode="stretch"
                  >
                    {isUnlocked ? (
                      <Text style={styles.buyText}>Received</Text>
                    ) : (
                      <View style={styles.priceInline}>
                        <Image
                          source={imgBone}
                          style={styles.priceBone}
                          resizeMode="contain"
                        />
                        <Text style={styles.buyText}>{activeDog.price}</Text>
                      </View>
                    )}
                  </ImageBackground>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity activeOpacity={0.85} onPress={nextDog}>
                <ImageBackground
                  source={imgSmallBtn}
                  style={styles.arrowBtn}
                  resizeMode="stretch"
                >
                  {imgArrowRight ? (
                    <Image source={imgArrowLeft} resizeMode="contain" />
                  ) : (
                    <Text style={styles.arrowText}>→</Text>
                  )}
                </ImageBackground>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.productsWrap}>
            <LinearGradient
              colors={['#EB924D', '#963B34']}
              style={{
                borderWidth: 1,
                borderColor: '#59173E',
                borderRadius: 12 * s,
              }}
            >
              <View style={styles.productRow}>
                <ImageBackground
                  source={imgSmallBtn}
                  style={styles.productIconBox}
                  resizeMode="stretch"
                >
                  <Image
                    source={imgFoodIcon}
                    style={styles.productIcon}
                    resizeMode="contain"
                  />
                </ImageBackground>

                <Text style={styles.productTitle}>Feed</Text>

                <Animated.View style={{ transform: [{ translateX: foodShakeX }] }}>
                  <TouchableOpacity activeOpacity={0.85} onPress={buyFood}>
                    <ImageBackground
                      source={require('../assets/images/scoreboard.png')}
                      style={styles.productPrice}
                      resizeMode="stretch"
                    >
                      <Image
                        source={imgBone}
                        style={styles.priceBoneSmall}
                        resizeMode="contain"
                      />
                      <Text style={styles.productPriceText}>
                        {pad3(PRICE_FEED)}
                      </Text>
                    </ImageBackground>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={['#EB924D', '#963B34']}
              style={{
                borderWidth: 1,
                borderColor: '#59173E',
                borderRadius: 12 * s,
              }}
            >
              <View style={styles.productRow}>
                <ImageBackground
                  source={imgSmallBtn}
                  style={styles.productIconBox}
                  resizeMode="stretch"
                >
                  <Image
                    source={imgWaterIcon}
                    style={styles.productIcon}
                    resizeMode="contain"
                  />
                </ImageBackground>

                <Text style={styles.productTitle}>Water</Text>

                <Animated.View style={{ transform: [{ translateX: waterShakeX }] }}>
                  <TouchableOpacity activeOpacity={0.85} onPress={buyWater}>
                    <ImageBackground
                      source={require('../assets/images/scoreboard.png')}
                      style={styles.productPrice}
                      resizeMode="stretch"
                    >
                      <Image
                        source={imgBone}
                        style={styles.priceBoneSmall}
                        resizeMode="contain"
                      />
                      <Text style={styles.productPriceText}>
                        {pad3(PRICE_WATER)}
                      </Text>
                    </ImageBackground>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </LinearGradient>
          </View>
        )}

        <View style={styles.tabsRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setTab('products')}
          >
            <ImageBackground
              source={imgTabProducts}
              style={[
                styles.tabBtn,
                tab === 'products' ? styles.tabActive : styles.tabInactive,
              ]}
              resizeMode="stretch"
            >
              <Text
                style={[
                  styles.tabText,
                  tab === 'products'
                    ? styles.tabTextActive
                    : styles.tabTextInactive,
                ]}
              >
                Products
              </Text>
            </ImageBackground>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} onPress={() => setTab('dogs')}>
            <ImageBackground
              source={imgTabDogs}
              style={[
                styles.tabBtn,
                tab === 'dogs' ? styles.tabActive : styles.tabInactive,
              ]}
              resizeMode="stretch"
            >
              <Text
                style={[
                  styles.tabText,
                  tab === 'dogs'
                    ? styles.tabTextActive
                    : styles.tabTextInactive,
                ]}
              >
                Dogs
              </Text>
            </ImageBackground>
          </TouchableOpacity>
        </View>
      </View>
    </Layout>
  );
};

export default MarketScreen;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  closeBtnBg: {
    width: 71 * s,
    height: 71 * s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    marginTop: -4 * s,
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
  balanceBoard: {
    alignSelf: 'center',
    marginTop: 6 * s,
    width: 166 * s,
    height: 60 * s,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10 * s,
    marginBottom: 20,
  },
  balanceBone: { width: 44 * s, height: 44 * s },
  balanceText: {
    fontSize: 21 * s,
    color: '#fff',
    fontFamily: 'Kanit-Medium',
  },
  dogsWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18 * s,
  },
  cardOuter: {
    width: 290 * s,
    height: 290 * s,
    borderRadius: 20 * s,
    borderWidth: 2,
    borderColor: '#59173E',
  },
  cardBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dogImage: {
    width: 136,
    height: 170,
    zIndex: 2,
    right: -50,
  },
  priceRow: {
    marginTop: 18 * s,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5 * s,
  },
  arrowBtn: {
    width: 70 * s,
    height: 70 * s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: { color: '#fff', fontSize: 24 * s, fontFamily: 'Kanit-SemiBold' },
  buyBoard: {
    width: 180 * s,
    height: 70 * s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyText: {
    fontSize: 22 * s,
    color: '#fff',
    fontFamily: 'Kanit-SemiBold',
    marginTop: -2 * s,
  },
  priceInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10 * s,
  },
  priceBone: { width: 34 * s, height: 24 * s },
  productsWrap: {
    flex: 1,
    paddingHorizontal: 18 * s,
    justifyContent: 'center',
    gap: 52 * s,
  },
  productRow: {
    width: '100%',
    height: 92 * s,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14 * s,
    justifyContent: 'space-between',
  },
  productIconBox: {
    width: 64 * s,
    height: 64 * s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productIcon: {
    width: 40 * s,
    height: 40 * s,
  },
  productTitle: {
    flex: 1,
    marginLeft: 14 * s,
    fontSize: 22 * s,
    color: '#fff',
    fontFamily: 'Kanit-SemiBold',
  },
  productPrice: {
    width: 120 * s,
    height: 52 * s,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8 * s,
  },
  priceBoneSmall: { width: 26 * s, height: 18 * s },
  productPriceText: {
    fontSize: 20 * s,
    color: '#fff',
    fontFamily: 'Kanit-SemiBold',
  },
  ownedRow: {
    alignItems: 'center',
    marginTop: 6 * s,
  },
  ownedText: {
    fontSize: 14 * s,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Kanit-SemiBold',
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18 * s,
    marginBottom: 24 * s,
    gap: 14 * s,
    marginTop: 20,
  },
  tabBtn: {
    width: (W - 72 * s) / 2,
    height: 64 * s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    opacity: 1,
  },
  tabInactive: {
    opacity: 0.9,
  },
  tabText: {
    fontSize: 20 * s,
    fontFamily: 'Kanit-SemiBold',
    marginTop: -2 * s,
  },
  tabTextActive: {
    color: '#fff',
  },
  tabTextInactive: {
    color: '#59173E',
  },
});
