import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import IntroLoader from '../components/IntroLoader';
import GetStartedScreen from '../screens/GetStartedScreen';
import HubScreen from '../screens/HubScreen';
import DogGameScreen from '../screens/DogGameScreen';
import MarketScreen from '../screens/MarketScreen';
import SkinsScreen from '../screens/SkinsScreen';

export type RootStackParamList = {
  IntroLoader: undefined;
  GetStartedScreen: undefined;
  HubScreen: undefined;
  DogGameScreen: undefined;
  MarketScreen: undefined;
  SkinsScreen: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const StackNavigation: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="IntroLoader" component={IntroLoader} />
      <Stack.Screen name="GetStartedScreen" component={GetStartedScreen} />
      <Stack.Screen name="HubScreen" component={HubScreen} />
      <Stack.Screen name="DogGameScreen" component={DogGameScreen} />
      <Stack.Screen name="MarketScreen" component={MarketScreen} />
      <Stack.Screen name="SkinsScreen" component={SkinsScreen} />
    </Stack.Navigator>
  );
};

export default StackNavigation;
