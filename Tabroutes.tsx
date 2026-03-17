// tabbbs

import DogGameScreen from './[Dgppyhsebnesrc]/[Dgppyhsebnesscrrs]/DogGameScreen';
import GuessWhereScreen from './[Dgppyhsebnesrc]/[Dgppyhsebnesscrrs]/GuessWhereScreen';
import HubScreen from './[Dgppyhsebnesrc]/[Dgppyhsebnesscrrs]/HubScreen';

import MarketScreen from './[Dgppyhsebnesrc]/[Dgppyhsebnesscrrs]/MarketScreen';

import SkinsScreen from './[Dgppyhsebnesrc]/[Dgppyhsebnesscrrs]/SkinsScreen';

import StoriesScreen from './[Dgppyhsebnesrc]/[Dgppyhsebnesscrrs]/StoriesScreen';
import React, { useCallback, useRef } from 'react';
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import {
  Animated,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

type TabParamList = {
  HubScreen: undefined;
  MarketScreen: undefined;
  DogGameScreen: undefined;
  GuessWhereScreen: undefined;
  SkinsScreen: undefined;
  StoriesScreen: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const TAB_BUTTON_BG = require('./[Dgppyhsebnesrc]/assets/images/smallButton.png');
const TAB_ICON_HOME = require('./[Dgppyhsebnesrc]/assets/images/tbb1.png');
const TAB_ICON_MARKET = require('./[Dgppyhsebnesrc]/assets/images/tbb2.png');
const TAB_ICON_GAME = require('./[Dgppyhsebnesrc]/assets/images/tbb3.png');
const TAB_ICON_GUESS = require('./[Dgppyhsebnesrc]/assets/images/tbb4.png');
const TAB_ICON_COLLECTION = require('./[Dgppyhsebnesrc]/assets/images/tbb5.png');
const TAB_ICON_STORIES = require('./[Dgppyhsebnesrc]/assets/images/tbb6.png');

const TAB_ICONS: Record<keyof TabParamList, any> = {
  HubScreen: TAB_ICON_HOME,
  MarketScreen: TAB_ICON_MARKET,
  DogGameScreen: TAB_ICON_GAME,
  GuessWhereScreen: TAB_ICON_GUESS,
  SkinsScreen: TAB_ICON_COLLECTION,
  StoriesScreen: TAB_ICON_STORIES,
};

const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const pressScalesRef = useRef<Record<string, Animated.Value>>({});

  const getScaleValue = useCallback((key: string) => {
    if (!pressScalesRef.current[key]) {
      pressScalesRef.current[key] = new Animated.Value(1);
    }
    return pressScalesRef.current[key];
  }, []);

  const animatePress = useCallback(
    (key: string, toValue: number) => {
      const v = getScaleValue(key);
      Animated.spring(v, {
        toValue,
        useNativeDriver: true,
        speed: 28,
        bounciness: 6,
      }).start();
    },
    [getScaleValue],
  );

  return (
    <View style={styles.wrap}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const scale = getScaleValue(route.key);
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        const options = descriptors[route.key]?.options;
        const accessibilityLabel = options?.tabBarAccessibilityLabel;
        const testID = options?.tabBarButtonTestID;
        const icon = TAB_ICONS[route.name as keyof TabParamList];

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={accessibilityLabel}
            testID={testID}
            onPress={onPress}
            onLongPress={onLongPress}
            onPressIn={() => animatePress(route.key, 0.88)}
            onPressOut={() => animatePress(route.key, 1)}
            style={styles.tabPressable}
          >
            <Animated.View style={{ transform: [{ scale }] }}>
              <ImageBackground
                source={TAB_BUTTON_BG}
                resizeMode="stretch"
                style={[styles.tabBg, isFocused && styles.tabBgActive]}
              >
                <Image
                  source={icon}
                  resizeMode="contain"
                  style={[styles.tabIcon, !isFocused && styles.tabIconInactive]}
                />
              </ImageBackground>
            </Animated.View>
          </Pressable>
        );
      })}
    </View>
  );
};

const Tabroutes: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="HubScreen"
      screenOptions={{ headerShown: false }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="HubScreen" component={HubScreen} />
      <Tab.Screen name="DogGameScreen" component={DogGameScreen} />
      <Tab.Screen name="MarketScreen" component={MarketScreen} />
      <Tab.Screen name="GuessWhereScreen" component={GuessWhereScreen} />
      <Tab.Screen name="SkinsScreen" component={SkinsScreen} />
      <Tab.Screen name="StoriesScreen" component={StoriesScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  tabPressable: {
    flex: 1,
    alignItems: 'center',
  },
  tabBg: {
    width: 58,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.92,
  },
  tabBgActive: {
    opacity: 1,
    transform: [{ translateY: -2 }],
  },
  tabIcon: {
    width: 28,
    height: 28,
  },
  tabIconInactive: {
    opacity: 0.8,
  },
});

export default Tabroutes;
