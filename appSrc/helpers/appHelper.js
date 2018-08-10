import moment from 'moment-timezone'
import { Dimensions, Platform, StatusBar } from 'react-native';
//--current date time in Europe format
export const currentDateTimeEuropeSTD = moment().tz('Europe/Berlin').format('YYYY-MM-DD HH:mm:ss')

//--iphone X helper and status bar height
export function isIphoneX() {
    const dimen = Dimensions.get('window');
    return (
        Platform.OS === 'ios' &&
        !Platform.isPad &&
        !Platform.isTVOS &&
        (dimen.height === 812 || dimen.width === 812)
    );
}

export function ifIphoneX(iphoneXStyle, regularStyle) {
    if (isIphoneX()) {
        return iphoneXStyle;
    }
    return regularStyle;
}

export function getStatusBarHeight(safe) {
    return Platform.select({
        ios: ifIphoneX(safe ? 44 : 30, 20),
        android: StatusBar.currentHeight
    });
}