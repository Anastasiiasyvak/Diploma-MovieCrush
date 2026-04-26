import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

export const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  
  centered: { 
    flex: 1, 
    width: '100%', 
    maxWidth: 480, 
    alignSelf: 'center' 
  },
  
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.cardDark,
    alignItems: 'center',
  },
  
  scrollContent: {
    paddingBottom: 40,
  },
  
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 60,
  },
  
  emoji: { 
    fontSize: 56 
  },
  
  title: { 
    fontFamily: FONTS.semiBold, 
    fontSize: 20, 
    color: COLORS.white 
  },
  
  subtitle: { 
    fontFamily: FONTS.regular, 
    fontSize: 14, 
    color: COLORS.darkGray 
  },
});