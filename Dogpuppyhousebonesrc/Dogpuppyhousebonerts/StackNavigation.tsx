import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import IntroLoader from '../Dogpuppyhousebonecmpnts/IntroLoader';
import GetStartedScreen from '../Dogpuppyhousebonesscrrs/GetStartedScreen';
import DogGameScreen from '../Dogpuppyhousebonesscrrs/DogGameScreen';
import MarketScreen from '../Dogpuppyhousebonesscrrs/MarketScreen';
import SkinsScreen from '../Dogpuppyhousebonesscrrs/SkinsScreen';
import StoryDetailsScreen from '../Dogpuppyhousebonesscrrs/StoryDetailsScreen';
import Tabroutes from '../../Tabroutes';
import { StoryId } from '../Dogpuppyhouseboncnsts/stories';

export type RootStackParamList = {
  IntroLoader: undefined;
  GetStartedScreen: undefined;
  Tabroutes: undefined;
  HubScreen: undefined;
  DogGameScreen: undefined;
  MarketScreen: undefined;
  SkinsScreen: undefined;
  StoryDetailsScreen: { storyId: StoryId };
};

const Stack = createStackNavigator<RootStackParamList>();

const StackNavigation: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="IntroLoader" component={IntroLoader} />
      <Stack.Screen name="GetStartedScreen" component={GetStartedScreen} />
      <Stack.Screen name="Tabroutes" component={Tabroutes} />
      <Stack.Screen name="DogGameScreen" component={DogGameScreen} />
      <Stack.Screen name="MarketScreen" component={MarketScreen} />
      <Stack.Screen name="SkinsScreen" component={SkinsScreen} />
      <Stack.Screen name="StoryDetailsScreen" component={StoryDetailsScreen} />
    </Stack.Navigator>
  );
};

export default StackNavigation;
