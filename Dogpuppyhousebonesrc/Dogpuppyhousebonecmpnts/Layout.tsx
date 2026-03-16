import React from 'react';
import { ImageBackground, ScrollView, StyleSheet } from 'react-native';

type LayoutProps = {
  children: React.ReactNode;
  scroll?: boolean;
};

const Layout = ({ children, scroll = true }: LayoutProps) => {
  return (
    <ImageBackground
      source={require('../assets/images/introback.png')}
      style={styles.bgImage}
    >
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollView}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </ImageBackground>
  );
};

export default Layout;

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
  },
});
