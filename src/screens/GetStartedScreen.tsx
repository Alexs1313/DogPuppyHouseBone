import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import Layout from '../components/Layout';
import { SLIDES } from '../data/slides';

type StackParams = {
  GetStartedScreen: undefined;
  HubScreen: undefined;
};

const GetStartedScreen: React.FC = () => {
  const [slideNumber, setSlideNumber] = useState(0);

  const navigation = useNavigation<NavigationProp<StackParams>>();

  const slide = useMemo(() => SLIDES[slideNumber], [slideNumber]);

  const nextScreen = useCallback(() => {
    setSlideNumber(prev => {
      if (prev < SLIDES.length - 1) return prev + 1;
      navigation.navigate('HubScreen');
      return prev;
    });
  }, [navigation]);

  return (
    <Layout>
      <View style={styles.maincontainer}>
        <ImageBackground
          source={require('../assets/images/headerframe.png')}
          style={styles.headerFrame}
          resizeMode="stretch"
        >
          <Text style={styles.headerText}>{slide.title}</Text>
        </ImageBackground>

        <Image source={slide.image} style={styles.slideImage} />

        <ImageBackground
          source={require('../assets/images/textboard.png')}
          style={styles.textBoard}
          resizeMode="stretch"
        >
          <View style={styles.textPad}>
            <Text style={styles.boardText}>{slide.text}</Text>
          </View>
        </ImageBackground>

        <TouchableOpacity activeOpacity={0.8} onPress={nextScreen}>
          <ImageBackground
            source={require('../assets/images/mainbutton.png')}
            style={styles.buttonBoard}
            resizeMode="stretch"
          >
            <Text style={styles.buttonText}>{slide.button}</Text>
          </ImageBackground>
        </TouchableOpacity>
      </View>
    </Layout>
  );
};

export default GetStartedScreen;

const styles = StyleSheet.create({
  maincontainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerFrame: {
    width: 314,
    height: 113,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideImage: {
    marginTop: 30,
  },
  textBoard: {
    width: 287,
    height: 211,
    marginTop: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textPad: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  buttonBoard: {
    width: 218,
    height: 79,
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Kanit-SemiBold',
    bottom: 6,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  boardText: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Kanit-Regular',
  },
  buttonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Kanit-SemiBold',
  },
});
