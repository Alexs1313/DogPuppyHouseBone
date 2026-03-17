import Layout from '../Dgppyhuseboncmpnts/Layout';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import Orientation from 'react-native-orientation-locker';
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
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const puppBonW0 = Dimensions.get('window').width;
const puppBonH = Dimensions.get('window').height;
const puppBonIsLandscape = puppBonW0 > puppBonH;

const puppBonS = puppBonIsLandscape
  ? puppBonW0 / 844
  : Math.min(puppBonW0 / 390, puppBonH / 844);

const puppBonStorageTotalBones = 'TOTAL_BONES';
const puppBonDefaultBones = 50;

const puppBonStorageUnlockedDogs = 'UNLOCKED_DOGS';
const puppBonStorageSkinEquipped = 'SKIN_EQUIPPED';
const puppBonSpeedBoostIntervalMs = 7000;
const puppBonSpeedBoostStep = 0.12;

const puppBonRand = (a: number, b: number) => a + Math.random() * (b - a);
const puppBonClamp = (v: number, a: number, b: number) =>
  Math.max(a, Math.min(b, v));
const puppBonUid = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const puppBonDogAssets: Record<DogId, Record<SkinId, any>> = {
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

const puppBonParseDogList = (raw: string | null): DogId[] => {
  try {
    const arr = raw ? JSON.parse(raw) : null;
    if (Array.isArray(arr) && arr.length) return arr as DogId[];
  } catch {}
  return ['dog-1'];
};

const puppBonParseEquipped = (raw: string | null): EquippedMap => {
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

const puppBonPickRandom = <T,>(arr: T[]) =>
  arr[Math.floor(Math.random() * arr.length)];

const DogGameScreen: React.FC<{ onClose?: () => void }> = () => {
  const [puppBonFallingTrash, setPuppBonFallingTrash] = useState<FallingItem[]>(
    [],
  );
  const puppBonItemsRef = useRef<FallingItem[]>([]);
  const [puppBonSessionBones, setPuppBonSessionBones] = useState(0);
  const [puppBonStrikes, setPuppBonStrikes] = useState(0);
  const [puppBonIsRunning, setPuppBonIsRunning] = useState(false);
  const [puppBonTotalBones, setPuppBonTotalBones] =
    useState<number>(puppBonDefaultBones);

  const puppBonNavigation = useNavigation();
  const [puppBonFieldW, setPuppBonFieldW] = useState(puppBonW0);
  const [puppBonFieldH, setPuppBonFieldH] = useState(1);

  const puppBonChosenDogIdRef = useRef<DogId>('dog-1');
  const [puppBonDogImgSource, setPuppBonDogImgSource] = useState<any>(
    require('../assets/images/dog1.png'),
  );

  const puppBonDogW = 130 * puppBonS;
  const puppBonDogH = 120 * puppBonS;
  const puppBonDogXRef = useRef((puppBonW0 - puppBonDogW) / 2);
  const puppBonDragStartX = useRef(0);
  const [, setPuppBonForceRender] = useState(0);

  const puppBonBoneW = 70 * puppBonS;
  const puppBonBoneH = 32 * puppBonS;
  const puppBonBadW = 70 * puppBonS;
  const puppBonBadH = 60 * puppBonS;

  const puppBonSpawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const puppBonTickIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const puppBonSpeedBoostIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const puppBonSpeedMultiplierRef = useRef(1);

  const puppBonDogY = Math.max(
    0,
    puppBonFieldH - puppBonDogH - (18 * puppBonS + 110),
  );

  useEffect(() => {
    (async () => {
      try {
        const [puppBonBonesRaw, puppBonUnlockedRaw, puppBonEquippedRaw] =
          await Promise.all([
            AsyncStorage.getItem(puppBonStorageTotalBones),
            AsyncStorage.getItem(puppBonStorageUnlockedDogs),
            AsyncStorage.getItem(puppBonStorageSkinEquipped),
          ]);

        const puppBonBonesValue = puppBonBonesRaw
          ? Number(puppBonBonesRaw)
          : null;

        const puppBonNextBones =
          puppBonBonesValue != null && Number.isFinite(puppBonBonesValue)
            ? puppBonBonesValue
            : puppBonDefaultBones;

        setPuppBonTotalBones(puppBonNextBones);

        if (puppBonBonesRaw == null) {
          await AsyncStorage.setItem(
            puppBonStorageTotalBones,
            String(puppBonNextBones),
          );
        }

        const puppBonUnlocked = puppBonParseDogList(puppBonUnlockedRaw);
        const puppBonEquipped = puppBonParseEquipped(puppBonEquippedRaw);

        const puppBonDogId = puppBonPickRandom(puppBonUnlocked);
        puppBonChosenDogIdRef.current = puppBonDogId;

        const puppBonSkin: SkinId = puppBonEquipped[puppBonDogId] || 'base';
        setPuppBonDogImgSource(
          puppBonDogAssets[puppBonDogId][puppBonSkin] ??
            puppBonDogAssets['dog-1'].base,
        );
      } catch {
        setPuppBonTotalBones(puppBonDefaultBones);
        puppBonChosenDogIdRef.current = 'dog-1';
        setPuppBonDogImgSource(puppBonDogAssets['dog-1'].base);
      }
    })();
  }, []);

  const puppBonStopLoops = useCallback(() => {
    if (puppBonSpawnIntervalRef.current) {
      clearInterval(puppBonSpawnIntervalRef.current);
    }
    if (puppBonTickIntervalRef.current) {
      clearInterval(puppBonTickIntervalRef.current);
    }
    if (puppBonSpeedBoostIntervalRef.current) {
      clearInterval(puppBonSpeedBoostIntervalRef.current);
    }

    puppBonSpawnIntervalRef.current = null;
    puppBonTickIntervalRef.current = null;
    puppBonSpeedBoostIntervalRef.current = null;
  }, []);

  const puppBonResetGame = useCallback(() => {
    puppBonStopLoops();
    puppBonSpeedMultiplierRef.current = 1;
    setPuppBonFallingTrash([]);
    puppBonItemsRef.current = [];
    setPuppBonSessionBones(0);
    setPuppBonStrikes(0);
    setPuppBonIsRunning(true);
  }, [puppBonStopLoops]);

  const puppBonStopGameSession = useCallback(() => {
    puppBonStopLoops();
    puppBonSpeedMultiplierRef.current = 1;
    setPuppBonIsRunning(false);
    setPuppBonFallingTrash([]);
    puppBonItemsRef.current = [];
    setPuppBonSessionBones(0);
    setPuppBonStrikes(0);
  }, [puppBonStopLoops]);

  useFocusEffect(
    useCallback(() => {
      Orientation.lockToPortrait();
      puppBonResetGame();

      (async () => {
        try {
          const puppBonEquippedRaw = await AsyncStorage.getItem(
            puppBonStorageSkinEquipped,
          );
          const puppBonEquipped = puppBonParseEquipped(puppBonEquippedRaw);
          const puppBonDogId = puppBonChosenDogIdRef.current;
          const puppBonSkin: SkinId = puppBonEquipped[puppBonDogId] || 'base';

          setPuppBonDogImgSource(
            puppBonDogAssets[puppBonDogId]?.[puppBonSkin] ??
              puppBonDogAssets['dog-1'].base,
          );
        } catch {}
      })();

      return () => {
        puppBonStopGameSession();
        Orientation.unlockAllOrientations();
      };
    }, [puppBonResetGame, puppBonStopGameSession]),
  );

  const puppBonSaveBonesAndAlert = useCallback(
    async (puppBonSession: number) => {
      try {
        const puppBonRaw = await AsyncStorage.getItem(puppBonStorageTotalBones);
        const puppBonTotal = puppBonRaw ? Number(puppBonRaw) || 0 : 0;

        Alert.alert(
          'Game over',
          `You collected ${puppBonSession} bones.\nTotal bones: ${puppBonTotal}`,
          [
            { text: 'Restart', onPress: puppBonResetGame },
            {
              text: 'Close',
              style: 'cancel',
              onPress: () => puppBonNavigation.goBack(),
            },
          ],
        );
      } catch {
        Alert.alert(
          'Game over',
          `You collected ${puppBonSession} bones.\n(Could not save to storage)`,
          [
            { text: 'Restart', onPress: puppBonResetGame },
            {
              text: 'Close',
              style: 'cancel',
              onPress: () => puppBonNavigation.goBack(),
            },
          ],
        );
      }
    },
    [puppBonNavigation, puppBonResetGame],
  );

  const puppBonEndGame = useCallback(() => {
    setPuppBonIsRunning(false);
    puppBonStopLoops();
    puppBonSaveBonesAndAlert(puppBonSessionBones);
  }, [puppBonSaveBonesAndAlert, puppBonSessionBones, puppBonStopLoops]);

  const puppBonSpawnItem = useCallback(() => {
    if (puppBonFieldW <= 10) return;

    const puppBonR = Math.random();
    const puppBonType: FallingType =
      puppBonR < 0.65 ? 'bone' : puppBonR < 0.82 ? 'trash' : 'nodogs';

    const puppBonW = puppBonType === 'bone' ? puppBonBoneW : puppBonBadW;
    const puppBonX = puppBonRand(
      8 * puppBonS,
      Math.max(8 * puppBonS, puppBonFieldW - puppBonW - 8 * puppBonS),
    );
    const puppBonSpeed =
      puppBonRand(2.6 * puppBonS, 5.1 * puppBonS) *
      puppBonSpeedMultiplierRef.current;

    const puppBonItem: FallingItem = {
      id: puppBonUid(),
      type: puppBonType,
      x: puppBonX,
      y: -80 * puppBonS,
      speed: puppBonSpeed,
    };

    puppBonItemsRef.current = [puppBonItem, ...puppBonItemsRef.current].slice(
      0,
      18,
    );
    setPuppBonFallingTrash(puppBonItemsRef.current);
  }, [puppBonBadW, puppBonBoneW, puppBonFieldW]);

  const puppBonCollide = useCallback(
    (puppBonIt: FallingItem) => {
      const puppBonDogX = puppBonDogXRef.current;

      const puppBonDogRect = {
        x: puppBonDogX,
        y: puppBonDogY,
        w: puppBonDogW,
        h: puppBonDogH,
      };

      const puppBonW = puppBonIt.type === 'bone' ? puppBonBoneW : puppBonBadW;
      const puppBonH = puppBonIt.type === 'bone' ? puppBonBoneH : puppBonBadH;

      const puppBonItemRect = {
        x: puppBonIt.x,
        y: puppBonIt.y,
        w: puppBonW,
        h: puppBonH,
      };

      const puppBonOverlapX =
        puppBonItemRect.x < puppBonDogRect.x + puppBonDogRect.w &&
        puppBonItemRect.x + puppBonItemRect.w > puppBonDogRect.x;

      const puppBonOverlapY =
        puppBonItemRect.y < puppBonDogRect.y + puppBonDogRect.h &&
        puppBonItemRect.y + puppBonItemRect.h > puppBonDogRect.y;

      return puppBonOverlapX && puppBonOverlapY;
    },
    [
      puppBonBadH,
      puppBonBadW,
      puppBonBoneH,
      puppBonBoneW,
      puppBonDogH,
      puppBonDogW,
      puppBonDogY,
    ],
  );

  const puppBonTick = useCallback(() => {
    const puppBonNextItems: FallingItem[] = [];
    let puppBonGotBone = 0;
    let puppBonGotBad = 0;

    for (const puppBonIt of puppBonItemsRef.current) {
      const puppBonMoved = {
        ...puppBonIt,
        y: puppBonIt.y + puppBonIt.speed * puppBonSpeedMultiplierRef.current,
      };

      if (puppBonCollide(puppBonMoved)) {
        if (puppBonMoved.type === 'bone') puppBonGotBone += 1;
        else puppBonGotBad += 1;
        continue;
      }

      if (puppBonMoved.y > puppBonFieldH + 120 * puppBonS) continue;

      puppBonNextItems.push(puppBonMoved);
    }

    if (puppBonGotBone) {
      setPuppBonSessionBones(v => v + puppBonGotBone);
      setPuppBonTotalBones(prev => {
        const puppBonNext = prev + puppBonGotBone;
        AsyncStorage.setItem(puppBonStorageTotalBones, String(puppBonNext));
        return puppBonNext;
      });
    }

    if (puppBonGotBad) {
      setPuppBonStrikes(prev => {
        const puppBonNextStrikes = prev + puppBonGotBad;
        if (puppBonNextStrikes >= 3) setTimeout(() => puppBonEndGame(), 0);
        return puppBonNextStrikes;
      });
    }

    puppBonItemsRef.current = puppBonNextItems;
    setPuppBonFallingTrash(puppBonNextItems);
  }, [puppBonCollide, puppBonEndGame, puppBonFieldH]);

  useEffect(() => {
    if (!puppBonIsRunning) return;

    puppBonSpeedMultiplierRef.current = 1;
    puppBonSpawnIntervalRef.current = setInterval(puppBonSpawnItem, 650);
    puppBonTickIntervalRef.current = setInterval(puppBonTick, 16);
    puppBonSpeedBoostIntervalRef.current = setInterval(() => {
      puppBonSpeedMultiplierRef.current += puppBonSpeedBoostStep;
    }, puppBonSpeedBoostIntervalMs);

    return () => puppBonStopLoops();
  }, [puppBonIsRunning, puppBonSpawnItem, puppBonStopLoops, puppBonTick]);

  const puppBonPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: () => {
          puppBonDragStartX.current = puppBonDogXRef.current;
        },

        onPanResponderMove: (_, g) => {
          const puppBonNextX = puppBonClamp(
            puppBonDragStartX.current + g.dx,
            8 * puppBonS,
            puppBonFieldW - puppBonDogW - 8 * puppBonS,
          );
          puppBonDogXRef.current = puppBonNextX;
          setPuppBonForceRender(n => n + 1);
        },
      }),
    [puppBonDogW, puppBonFieldW],
  );

  const puppBonRenderItem = (puppBonIt: FallingItem) => {
    const puppBonIsBone = puppBonIt.type === 'bone';

    const puppBonSrc =
      puppBonIt.type === 'bone'
        ? require('../assets/images/bone.png')
        : puppBonIt.type === 'trash'
        ? require('../assets/images/trash.png')
        : require('../assets/images/nodogs.png');

    return (
      <Image
        key={puppBonIt.id}
        source={puppBonSrc}
        style={[
          puppBonStyles.puppBonFalling,
          {
            left: puppBonIt.x,
            top: puppBonIt.y,
            width: puppBonIsBone ? puppBonBoneW : puppBonBadW,
            height: puppBonIsBone ? puppBonBoneH : puppBonBadH,
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
          paddingTop: 50 * puppBonS,
          paddingBottom: 12 * puppBonS,
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
            source={require('../assets/images/smallHead.png')}
            style={puppBonStyles.puppBonHeader}
            resizeMode="stretch"
          >
            <Text style={puppBonStyles.puppBonHeaderText}>Game</Text>
          </ImageBackground>
        </View>

        <ImageBackground
          source={require('../assets/images/scoreboard.png')}
          style={puppBonStyles.puppBonScoreBoard}
          resizeMode="stretch"
        >
          <Image
            source={require('../assets/images/bone.png')}
            style={puppBonStyles.puppBonScoreBone}
            resizeMode="contain"
          />
          <Text style={puppBonStyles.puppBonScoreText}>
            {String(puppBonSessionBones).padStart(3, '0')}
          </Text>
        </ImageBackground>

        <View
          style={puppBonStyles.puppBonPlayField}
          onLayout={e => {
            const { width, height } = e.nativeEvent.layout;
            setPuppBonFieldW(width);
            setPuppBonFieldH(height);

            puppBonDogXRef.current = puppBonClamp(
              puppBonDogXRef.current,
              8 * puppBonS,
              width - puppBonDogW - 8 * puppBonS,
            );
          }}
        >
          {puppBonFallingTrash.map(puppBonRenderItem)}

          <View
            style={[
              puppBonStyles.puppBonDogWrap,
              {
                left: puppBonDogXRef.current,
                top: puppBonDogY,
                width: puppBonDogW,
                height: puppBonDogH,
              },
            ]}
            {...puppBonPanResponder.panHandlers}
          >
            <Image
              source={puppBonDogImgSource}
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

const puppBonStyles = StyleSheet.create({
  puppBonScreen: { flex: 1 },
  puppBonCloseBtnBg: {
    width: 71 * puppBonS,
    height: 71 * puppBonS,
    justifyContent: 'center',
    alignItems: 'center',
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
  puppBonScoreBoard: {
    alignSelf: 'center',
    marginTop: 10 * puppBonS,
    width: 220 * puppBonS,
    height: 64 * puppBonS,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10 * puppBonS,
    zIndex: 5,
  },
  puppBonScoreBone: { width: 44 * puppBonS, height: 44 * puppBonS },
  puppBonScoreText: {
    fontSize: 23 * puppBonS,
    color: '#fff',
    fontFamily: 'Kanit-SemiBold',
  },
  puppBonPlayField: {
    flex: 1,
    position: 'relative',
  },
  puppBonFalling: {
    position: 'absolute',
  },
  puppBonDogWrap: {
    position: 'absolute',
    zIndex: 9,
  },
});
