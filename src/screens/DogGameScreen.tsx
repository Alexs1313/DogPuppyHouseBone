import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Layout from '../components/Layout';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Orientation from 'react-native-orientation-locker';

type FallingType = 'bone' | 'trash' | 'nodogs';

type FallingItem = {
  id: string;
  type: FallingType;
  x: number;
  y: number;
  speed: number;
};

type DogId = 'dog-1' | 'dog-2' | 'dog-3' | 'dog-4';
type SkinId = 'base' | 'alt';
type EquippedMap = Record<DogId, SkinId>;

const { width: W0, height: H } = Dimensions.get('window');
const isLandscape = W0 > H;

const s = isLandscape ? W0 / 844 : Math.min(W0 / 390, H / 844);

const STORAGE_TOTAL_BONES = 'TOTAL_BONES';

const STORAGE_UNLOCKED_DOGS = 'UNLOCKED_DOGS';
const STORAGE_SKIN_EQUIPPED = 'SKIN_EQUIPPED';

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const uid = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const DOG_ASSETS: Record<DogId, Record<SkinId, any>> = {
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

const parseDogList = (raw: string | null): DogId[] => {
  try {
    const arr = raw ? JSON.parse(raw) : null;
    if (Array.isArray(arr) && arr.length) return arr as DogId[];
  } catch {}
  return ['dog-1'];
};

const parseEquipped = (raw: string | null): EquippedMap => {
  const base: EquippedMap = {
    'dog-1': 'base',
    'dog-2': 'base',
    'dog-3': 'base',
    'dog-4': 'base',
  };
  try {
    const obj = raw ? JSON.parse(raw) : null;
    if (obj && typeof obj === 'object') {
      (Object.keys(base) as DogId[]).forEach(id => {
        const v = (obj as any)[id];
        if (v === 'base' || v === 'alt') base[id] = v;
      });
    }
  } catch {}
  return base;
};

const pickRandom = <T,>(arr: T[]) =>
  arr[Math.floor(Math.random() * arr.length)];

const DogGameScreen: React.FC<{ onClose?: () => void }> = () => {
  const [items, setItems] = useState<FallingItem[]>([]);
  const itemsRef = useRef<FallingItem[]>([]);
  const [sessionBones, setSessionBones] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [totalBones, setTotalBones] = useState<number>(0);

  const navigation = useNavigation();
  const [fieldW, setFieldW] = useState(W0);
  const [fieldH, setFieldH] = useState(1);

  const chosenDogIdRef = useRef<DogId>('dog-1');
  const [dogImgSource, setDogImgSource] = useState<any>(
    require('../assets/images/dog1.png'),
  );

  const dogW = 130 * s;
  const dogH = 120 * s;
  const dogXRef = useRef((W0 - dogW) / 2);
  const dragStartX = useRef(0);
  const [, forceRender] = useState(0);

  const boneW = 70 * s;
  const boneH = 32 * s;
  const badW = 70 * s;
  const badH = 60 * s;

  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const dogY = Math.max(0, fieldH - dogH - 18 * s);

  useEffect(() => {
    (async () => {
      try {
        const [bonesRaw, unlockedRaw, equippedRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_TOTAL_BONES),
          AsyncStorage.getItem(STORAGE_UNLOCKED_DOGS),
          AsyncStorage.getItem(STORAGE_SKIN_EQUIPPED),
        ]);

        setTotalBones(bonesRaw ? Number(bonesRaw) || 0 : 0);

        const unlocked = parseDogList(unlockedRaw);

        const equipped = parseEquipped(equippedRaw);

        const dogId = pickRandom(unlocked);
        chosenDogIdRef.current = dogId;

        const skin: SkinId = equipped[dogId] || 'base';
        setDogImgSource(DOG_ASSETS[dogId][skin] ?? DOG_ASSETS['dog-1'].base);
      } catch {
        setTotalBones(0);
        chosenDogIdRef.current = 'dog-1';
        setDogImgSource(DOG_ASSETS['dog-1'].base);
      }
    })();
  }, []);

  const stopLoops = useCallback(() => {
    if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    spawnIntervalRef.current = null;
    tickIntervalRef.current = null;
  }, []);

  const resetGame = useCallback(() => {
    stopLoops();
    setItems([]);
    itemsRef.current = [];
    setSessionBones(0);
    setStrikes(0);
    setIsRunning(true);
  }, [stopLoops]);

  useFocusEffect(
    useCallback(() => {
      Orientation.lockToPortrait();
      return () => {
        Orientation.unlockAllOrientations();
      };
    }, []),
  );

  const saveBonesAndAlert = useCallback(
    async (session: number) => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_TOTAL_BONES);
        const prev = raw ? Number(raw) || 0 : 0;
        const next = prev + session;
        await AsyncStorage.setItem(STORAGE_TOTAL_BONES, String(next));
        setTotalBones(next);

        Alert.alert(
          'Game over',
          `You collected ${session} bones.\nTotal bones: ${next}`,
          [
            { text: 'Restart', onPress: resetGame },
            {
              text: 'Close',
              style: 'cancel',
              onPress: () => navigation.goBack(),
            },
          ],
        );
      } catch {
        Alert.alert(
          'Game over',
          `You collected ${session} bones.\n(Could not save to storage)`,
          [
            { text: 'Restart', onPress: resetGame },
            {
              text: 'Close',
              style: 'cancel',
              onPress: () => navigation.goBack(),
            },
          ],
        );
      }
    },
    [navigation, resetGame],
  );

  const endGame = useCallback(() => {
    setIsRunning(false);
    stopLoops();
    saveBonesAndAlert(sessionBones);
  }, [saveBonesAndAlert, sessionBones, stopLoops]);

  const spawnItem = useCallback(() => {
    if (fieldW <= 10) return;

    const r = Math.random();
    const type: FallingType = r < 0.65 ? 'bone' : r < 0.82 ? 'trash' : 'nodogs';

    const w = type === 'bone' ? boneW : badW;
    const x = rand(8 * s, Math.max(8 * s, fieldW - w - 8 * s));
    const speed = rand(2.3 * s, 4.6 * s);

    const item: FallingItem = {
      id: uid(),
      type,
      x,
      y: -80 * s,
      speed,
    };

    itemsRef.current = [item, ...itemsRef.current].slice(0, 18);
    setItems(itemsRef.current);
  }, [badW, boneW, fieldW]);

  const collide = useCallback(
    (it: FallingItem) => {
      const dogX = dogXRef.current;

      const dogRect = {
        x: dogX,
        y: dogY,
        w: dogW,
        h: dogH,
      };

      const w = it.type === 'bone' ? boneW : badW;
      const h = it.type === 'bone' ? boneH : badH;

      const itemRect = { x: it.x, y: it.y, w, h };

      const overlapX =
        itemRect.x < dogRect.x + dogRect.w &&
        itemRect.x + itemRect.w > dogRect.x;

      const overlapY =
        itemRect.y < dogRect.y + dogRect.h &&
        itemRect.y + itemRect.h > dogRect.y;

      return overlapX && overlapY;
    },
    [badH, badW, boneH, boneW, dogH, dogW, dogY],
  );

  const tick = useCallback(() => {
    const nextItems: FallingItem[] = [];
    let gotBone = 0;
    let gotBad = 0;

    for (const it of itemsRef.current) {
      const moved = { ...it, y: it.y + it.speed };

      if (collide(moved)) {
        if (moved.type === 'bone') gotBone += 1;
        else gotBad += 1;
        continue;
      }

      if (moved.y > fieldH + 120 * s) continue;

      nextItems.push(moved);
    }

    if (gotBone) setSessionBones(v => v + gotBone);

    if (gotBad) {
      setStrikes(prev => {
        const n = prev + gotBad;
        if (n >= 3) setTimeout(() => endGame(), 0);
        return n;
      });
    }

    itemsRef.current = nextItems;
    setItems(nextItems);
  }, [collide, endGame, fieldH]);

  useEffect(() => {
    if (!isRunning) return;

    spawnIntervalRef.current = setInterval(spawnItem, 650);
    tickIntervalRef.current = setInterval(tick, 16);

    return () => stopLoops();
  }, [isRunning, spawnItem, stopLoops, tick]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: () => {
          dragStartX.current = dogXRef.current;
        },

        onPanResponderMove: (_, g) => {
          const nextX = clamp(
            dragStartX.current + g.dx,
            8 * s,
            fieldW - dogW - 8 * s,
          );
          dogXRef.current = nextX;
          forceRender(n => n + 1);
        },
      }),
    [dogW, fieldW],
  );

  const renderItem = (it: FallingItem) => {
    const isBone = it.type === 'bone';

    const src =
      it.type === 'bone'
        ? require('../assets/images/bone.png')
        : it.type === 'trash'
        ? require('../assets/images/trash.png')
        : require('../assets/images/nodogs.png');

    return (
      <Image
        key={it.id}
        source={src}
        style={[
          styles.falling,
          {
            left: it.x,
            top: it.y,
            width: isBone ? boneW : badW,
            height: isBone ? boneH : badH,
          },
        ]}
        resizeMode="contain"
      />
    );
  };

  return (
    <Layout scroll={false}>
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
              source={require('../assets/images/smallButton.png')}
              style={styles.closeBtnBg}
              resizeMode="stretch"
            >
              <Image source={require('../assets/images/close.png')} />
            </ImageBackground>
          </TouchableOpacity>

          <ImageBackground
            source={require('../assets/images/smallHead.png')}
            style={styles.header}
            resizeMode="stretch"
          >
            <Text style={styles.headerText}>Game</Text>
          </ImageBackground>
        </View>

        <ImageBackground
          source={require('../assets/images/scoreboard.png')}
          style={styles.scoreBoard}
          resizeMode="stretch"
        >
          <Image
            source={require('../assets/images/bone.png')}
            style={styles.scoreBone}
            resizeMode="contain"
          />
          <Text style={styles.scoreText}>
            {String(sessionBones).padStart(3, '0')}
          </Text>
        </ImageBackground>

        <View
          style={styles.playField}
          onLayout={e => {
            const { width, height } = e.nativeEvent.layout;
            setFieldW(width);
            setFieldH(height);

            dogXRef.current = clamp(
              dogXRef.current,
              8 * s,
              width - dogW - 8 * s,
            );
          }}
        >
          {items.map(renderItem)}

          <View
            style={[
              styles.dogWrap,
              { left: dogXRef.current, top: dogY, width: dogW, height: dogH },
            ]}
            {...panResponder.panHandlers}
          >
            <Image
              source={dogImgSource}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    </Layout>
  );
};

export default DogGameScreen;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  closeBtnBg: {
    width: 71 * s,
    height: 71 * s,
    justifyContent: 'center',
    alignItems: 'center',
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
  scoreBoard: {
    alignSelf: 'center',
    marginTop: 10 * s,
    width: 220 * s,
    height: 64 * s,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10 * s,
    zIndex: 5,
  },
  scoreBone: { width: 44 * s, height: 44 * s },
  scoreText: {
    fontSize: 24 * s,
    color: '#fff',
    fontFamily: 'Kanit-SemiBold',
  },
  playField: {
    flex: 1,
    position: 'relative',
  },
  falling: {
    position: 'absolute',
  },
  dogWrap: {
    position: 'absolute',
    zIndex: 9,
  },
});
