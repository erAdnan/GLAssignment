import React, { Component } from 'react';
import { View, Text, TouchableHighlight, FlatList, ScrollView,
    StyleSheet, TouchableOpacity, NetInfo, PermissionsAndroid, StatusBar,
    Image, ActivityIndicator, AsyncStorage, Animated, Easing,Linking,
    Platform, BackHandler, Dimensions } from 'react-native'
import { Button, Avatar, Card, List, ListItem } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as Animatable from 'react-native-animatable';
import Permissions from 'react-native-permissions'
//import I18n from 'react-native-i18n';
import I18n from '../../i18n'
// import moment from 'moment';
import moment from 'moment-timezone';
import images from '../../config/images'
import { connect } from 'react-redux'
import { formDataStyles, drawerStyles } from '../../customStyles';
import * as Toolbar from '../../components/Toolbar';
import Colors from '../../config/colors'
import { NavigateToNFCManager, NavigateToRNCamera, NavigateToQRScanner, NavigateToStudentDetailsPage } from '../../actions/navigation';
import CSDateAndTimePicker from '../../components/CSDateAndTimePicker';
import { ActionSheetCustom as ActionSheet } from '../../components/BottomActionSheet';
import {SERVICE_URL_KEY, WEB_URL_KEY, IS_USER_ACTIVE, IS_USER_LOGGED_IN, ACTIVE_USER_DATA, IMAGE_URL_PATH, SCHEDULED_SESSION_ID} from '../../constants';
import {currentDateTimeEuropeSTD, getStatusBarHeight} from '../../helpers/appHelper';
import { getSubjectsOfTeachers } from '../../actions/getSubjectListForTeacher';
import * as SessionAction from '../../actions/sessionAction';
import * as GeneralActions from '../../actions/general';
import CustomSnackbar from '../../components/CustomSnackbar';
import * as CustomDialog from '../../components/CustomDialog';
import {CircularLoader, BubbleStyleLoader} from '../../components/Loader';
import * as ScannerModal from '../../components/HomeScreenModals/scannerModal';
import * as AddSubjectModal from '../../components/HomeScreenModals/addSubjectModal';
import * as StudentListModal from '../../components/HomeScreenModals/studentListModal';
import * as AlertInfoModal from '../../components/HomeScreenModals/alertInfoModal';
import MarqueeText from '../../components/MarqueeText';
import SessionItems from './SessionItem';
import _ from 'lodash';
import AppLevelVariables from '../../constants/appLevelVariables';
import NfcManager, {NdefParser} from 'react-native-nfc-manager';


const CANCEL_INDEX = -1
const NO_DATA_TEXT = 'No data to show'
const noData = [NO_DATA_TEXT, NO_DATA_TEXT]

const title = '';
const SELECT_SUBJECT_TITLE = "";

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

let WS_URL_VALUE, WEB_KEY_URL_VALUE, isNewSessionStarted = false, isAPICalled = false, isSMSTriggered = true, isSessionEnded = true, isImmidiateStartScheduleSession = false, isImmidiateStartScheduleSubjectID;
let callSetIntervalForLastSession, callSetIntervalForPollCommon, smsSendLateTime;
let didFocusSubscription, didBlurSubscription, sessionCreatedTime;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection:'column',
        backgroundColor: '#FFF',
       // paddingRight:2,
       // paddingLeft: 2
    },
    topHalfContainer: {
        flexDirection:'row',
        flex:0.3,
    },
    bottomContainer: {
      flexDirection:'column',
      marginTop:0,
      flex:0.7,
      borderRadius: 0,
      borderWidth: 0,
      borderColor: '#939191',
      borderBottomWidth: 1,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.8,
  shadowRadius: 5,
  elevation: 3,
 // marginLeft: 5,
  //marginRight: 5,
  marginTop: 10,
      
  },
    sessionAndScanView: {
        flex: 1,
        padding: 0,
        //margin: 2,
        // alignItems: 'flex-start',
       // backgroundColor: 'white',
        //borderRadius: 10,
       // borderWidth: 1,
       // borderColor: 'green',
        borderRadius: 0,
        borderWidth: 0,
        borderColor: '#939191',
        borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 3,
   // marginLeft: 5,
    //marginRight: 5,
    marginTop: 10,
    },
    subjectView: {
      flex:1,
      padding: 2,
      alignItems:'center',
      justifyContent:'center'
    },
    subjectGropuTitleBg: {
      flex: 0.2,
      padding: 0,
      alignItems: 'center',
      backgroundColor: 'rgba(92, 99,216, 1)',
      borderRadius: 0,
      borderWidth: 1,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderColor: 'green',
  },
  listItemHeaderTitle: {
    fontSize: 18,
    justifyContent: 'center',
    color: '#3A3A3A',
    fontWeight: 'bold',
  },
  noItemText: {
    fontSize: 18,
    justifyContent: 'space-between',
    textAlign: 'center',
    color: 'grey',
    fontWeight: 'bold',
  },
  listItemTitle: {
    fontSize: 12,
    marginTop: 2,
    color: '#000',
    fontWeight: 'bold',
  },
  listItemSubTitle: {
    fontSize: 12,
    marginTop: 2,
    color: '#B2B2B2',
    fontWeight: 'bold',
  },
  avatarContainerStyle: {
    width: 80,
    height: 80,
    // borderWidth: 2,
    // borderColor: '#F44336',
    // borderRadius: 80,
    // marginLeft:5,
    justifyContent:'center'
  },
  buttonStyle: {
        backgroundColor:'grey'
  }
});

class Sessions extends Component {

    static navigationOptions = ({ navigation }) => ({
      tabBarLabel: 'Sessions',
      tabBarIcon: () => <Image style={{width: 24, height: 24}} source={images.iconTabSessions}/>,
      tabBarOnPress: (tab, jumpToIndex) => {
          const {
              dispatch,
              state,
          } = navigation
          const stackRouteName = ['Dashboard', 'Sessions', 'Reports', 'Settings'][tab.index]
          // the new tab is not first in the stack
          if (!tab.focused) {
            jumpToIndex(tab.index);
            if(navigation.state.params) {
              // navigation.state.params.onSessionTabFocus();
            }
          }
      }
    })
    

    constructor(props) {
        super(props);
        SELECT_SUBJECT_TITLE = I18n.t('LANGUAGE_CONSTANTS.please_select');
        title = I18n.t('LANGUAGE_CONSTANTS.select_one_subject');
        isSessionEnded = true
        this.state = {
          isDateTimePickerVisible: false,
          add_subject_alert_visibility: false,
          student_list_alert_visibility: false,
          sessionStartStatus: false,
          disableSelectSubjectButtonState: false,
          disableSessionButtonState: false,
          isLoading: true,
          data: [],
          page: 1,
          seed: 1,
          error: null,
          refreshing: false,
          date: '',
          startTime: moment().tz('Europe/Berlin').format('HH:mm'),
          endTime: moment().subtract(1,'days').endOf('day').format('HH:mm').toString(),
          disableScheduleButton: false,
          selectedSheetItem: SELECT_SUBJECT_TITLE,
          DESTRUCTIVE_INDEX: 0,
          dialogInputFieldValueSubjectName:'',
          dialogInputFieldValueSubjectCode: '',
          listOfSelectedStudents: [],
          isAllStudentsSelected: false,
          isSessionStarted: false,
          wsURLValue: '',
          webURLValue: '',
          imageURL: '',
          isDispatchedAlreadyStarted: false,
          isSessionEndedSuccessfully: false,
          alert_visibility: false,
          studentIDToBeOperated: '',
          alertTitle: "Confirm ",
          alertBody:" ",
          submitButtonText: '',
          lastContinueSessionID: '',
          avatarBorderColor: '#E40B0B',
          studentCheckedInStatus: null,
          studentListDialogSubmitButtonTitle: '',
          listOfSelectedStudentIDs: [],
          blinkBorder: false,
          haskKeysArray: [],
          absenceMessage: '',
          absenceFromValue: '',
          absenceUptoValue: '',
          absenceTypeValue: '',
          listAvatarLoading: true
        };
        this.fadeAnim = new Animated.Value(0);
    }

    componentDidMount() {

        // console.log("session componenetDidMount this.props:", this.props)
        this.props.dispatch(GeneralActions.showLoaderForSession())
        this._initSession()
        this._startNFCDetection()
        didFocusSubscription = this.props.navigation.addListener(
          'didFocus',
          payload => {
            this._onFocus();
          
          }
        );

      didBlurSubscription = this.props.navigation.addListener(
          'didBlur',
          payload => {
            // clearInterval(callSetIntervalForLastSession)
            // clearInterval(callSetIntervalForPollCommon)
          }
        );
    }


    componentWillUnmount() {
      console.log('Session WillUnmount')
      //--Remove the listener when you are done
      didFocusSubscription.remove();
      didBlurSubscription.remove();
      this._stopNFCDetection()
  }

    _initSession = async () => {
      //--setParams for session on button press
      this.props.navigation.setParams({
        onSessionTabFocus: this._onFocus.bind(this)
      })

      try {
        WS_URL_VALUE = await AsyncStorage.getItem(SERVICE_URL_KEY);
        WEB_KEY_URL_VALUE = await AsyncStorage.getItem(WEB_URL_KEY);

        var activeUserData = await AsyncStorage.getItem(ACTIVE_USER_DATA);
          if (activeUserData) {
              //= 0-username, 1-password, 2-userId, 3-schoolId, 4-sysId, 5-role, 6-lateTime, 7-sessionDelay, 8-countDownTime, 9- autoStartFlag
              var separatedData = activeUserData.split("|");
              smsSendLateTime = separatedData[6]
          }
       
      } catch (err) {
        console.log("session componenetDidMount:error in getting WSURL", err)
      }
    }

    _onFocus = () => {
      // this.setState({isDispatchedAlreadyStarted : false})
      this.fetchSubjectOfTeacher();
      this.fetchAllStudentsOfSchool();
      this.startLastSessionApiCall();
      // this.startSessionIntentServiceCall()

    }

    UNSAFE_componentWillReceiveProps (nextProps) {

      console.log('session WillReceiveProps nextProps:', nextProps)
      //--set current schedule data
      if (nextProps.startSchduledSessionBySubjectID !== undefined) {
        if (!_.isEqual(this.props.startSchduledSessionBySubjectID, nextProps.startSchduledSessionBySubjectID)) {
          this.dispatchSessionCall(nextProps.startSchduledSessionBySubjectID)
        }
      }

      if (nextProps.startSessionFromMobileProps.successResponse) {
        
        this.props.dispatch(GeneralActions.hideLoaderForSession())
          /*
            --start session
          */
         if(nextProps.startSessionFromMobileProps.isPollAgain === true) {
          setTimeout(() => {
            if(nextProps.startSessionFromMobileProps.sessionID) {
              this.pollCommonForMobile(nextProps.startSessionFromMobileProps.sessionID, isSMSTriggered)
            }
          }, 2000)
         } else if(nextProps.startSessionFromMobileProps.isPollAgain === false) {
          console.log('session WillReceiveProps nextProps:isPollAgain === false')
          this.startLastSessionApiCall();
         }
          // if (!_.isEqual(this.props.startSessionFromMobileProps.successResponse, nextProps.startSessionFromMobileProps.successResponse))
          // {
                if(nextProps.startSessionFromMobileProps.successResponse.nameValuePairs.last_session) {
                  const subjectName = nextProps.startSessionFromMobileProps.successResponse.nameValuePairs.last_session.nameValuePairs.session_SubjectName;
                  sessionCreatedTime = nextProps.startSessionFromMobileProps.successResponse.nameValuePairs.last_session.nameValuePairs.session_CreatedDateTime;
                  
                  if (isSessionEnded) {
                    this.setState({ selectedSheetItem: subjectName,
                      DESTRUCTIVE_INDEX: 1,
                      // isDispatchedAlreadyStarted: true,
                      isSessionEndedSuccessfully: false});
                  }
                }
           
                if (isSessionEnded) {
                  isSessionEnded = false;
                  this.setState({
                    sessionStartStatus: true, 
                    isSessionStarted: true, 
                    disableSelectSubjectButtonState: true,
                    disableSessionButtonState: true,})
                  setTimeout(() => {
                    this.setState({disableSessionButtonState: false})
                  }, 10000)

                  console.log('if startSessionFromMobileProps.sessionID:', nextProps.startSessionFromMobileProps.sessionID)
                //--trigger sms
                  //--setTimeout for sendAbsenceSMS call
                  this.pollCommonForMobile(nextProps.startSessionFromMobileProps.sessionID, isSMSTriggered)

                  if(isNewSessionStarted === true) {
                    const currentDateTime = moment().tz('Europe/Berlin').format('YYYY-MM-DD HH:mm:ss')
                    if ((currentDateTime - sessionCreatedTime) > smsSendLateTime*60*1000) {
                      this.checkTriggerSMS(nextProps.startSessionFromMobileProps.sessionID)
                    } else {
                      const timeOutTime = smsSendLateTime*60*1000 - (currentDateTime - sessionCreatedTime)
                      setTimeout(() => {
                        this.checkTriggerSMS(nextProps.startSessionFromMobileProps.sessionID)
                      }, timeOutTime)
                    }
                  }
                }
          // }
      }
      //--startsession error response
      if(nextProps.startSessionFromMobileProps.errorResponse) {
        this.props.dispatch(GeneralActions.hideLoaderForSession())
        if(!_.isEqual(this.props.startSessionFromMobileProps.errorResponse, nextProps.startSessionFromMobileProps.errorResponse)) {
          //--end session
          console.log('nextProps.startSessionFromMobileProps.errorResponse :')
          isSessionEnded = true;
           //--clear end session props
          this.props.dispatch(GeneralActions.clearEndSessionNextState())
          this.props.dispatch(GeneralActions.clearStartNewSessionNextState())
          this.props.dispatch(GeneralActions.clearLastContinueSesionNextState())
          this.startLastSessionApiCall();
  
          this.setState({sessionStartStatus: false, isSessionStarted: false, 
            disableSessionButtonState: false,
            disableSelectSubjectButtonState: false,
            isSessionEndedSuccessfully: true
          })
        }
      }
      //--if error for pollCommon then continue poll call
      if(nextProps.pollCommonProps.errorResponse) { 
        this.props.dispatch(GeneralActions.clearPollCommonData())
        if(nextProps.startSessionFromMobileProps.sessionID) {
          // this.pollCommonForMobile(nextProps.startSessionFromMobileProps.sessionID, isSMSTriggered)
        }
      }
      
      // //--call poll common on false
      if(nextProps.sendAbsenceSMSProps.successResponse) {
        if(!_.isEqual(this.props.sendAbsenceSMSProps.successResponse, nextProps.sendAbsenceSMSProps.successResponse)) {
          isSMSTriggered = true;
          // this.pollCommonForMobile(nextProps.startSessionFromMobileProps.sessionID, isSMSTriggered)
        }
      }
      
      if(nextProps.sendAbsenceSMSProps.errorResponse) {
        if(!_.isEqual(this.props.sendAbsenceSMSProps.errorResponse, nextProps.sendAbsenceSMSProps.errorResponse)) {
          // isSMSTriggered = false;
          // this.pollCommonForMobile(nextProps.startSessionFromMobileProps.sessionID, isSMSTriggered)
        }
      }
      
      //--end session response 
      if (nextProps.endSessionFromMobileProps.successResponse) {
        // this._stopNFCDetection()
        //--end session
        isSessionEnded = true;
        // isNewSessionStarted= false;
         //--clear end session props
        this.props.dispatch(GeneralActions.clearEndSessionNextState())
        this.props.dispatch(GeneralActions.clearStartNewSessionNextState())
        this.props.dispatch(GeneralActions.clearLastContinueSesionNextState())
        // clearInterval(callSetIntervalForPollCommon);

        this.toolbar.showTopToDownAlert("success",  I18n.t('LANGUAGE_CONSTANTS.successful'),  I18n.t('LANGUAGE_CONSTANTS.session_ended'))

        this.setState({
          selectedSheetItem: SELECT_SUBJECT_TITLE,
          sessionStartStatus: false, 
          isSessionStarted: false, 
          disableSessionButtonState: false,
          disableSelectSubjectButtonState: false,
          isSessionEndedSuccessfully: true
        })

        this.startLastSessionApiCall();
      }
        /*
        --checkAnySessionForTeacherProps
        */
      if (nextProps.checkAnySessionForTeacherProps.successResponse) {
        // console.log('session willrecvprops checkAnySessionForTeacherProps:',nextProps.checkAnySessionForTeacherProps.successResponse);
        //--show dialog for if wants to continue session
        this.showContinueOtherSessionDialog(true, nextProps.checkAnySessionForTeacherProps.successResponse)
      }
     
      /*
        -- makeStudentAttendanceFromMobileProps response
      */
     if (nextProps.makeStudentAttendanceFromMobileProps.successResponse) {
      isAPICalled = false;
        if(nextProps.makeStudentAttendanceFromMobileProps.successResponse.nameValuePairs.check_status_completed) {
          //--CheckedIn successfully
          //-- clear make attndprops update the last on going session
          this.props.dispatch(GeneralActions.hideLoaderForSession())
          this.props.dispatch(GeneralActions.clearMarkStudentAttendanceProps())
        } else if (nextProps.makeStudentAttendanceFromMobileProps.successResponse.nameValuePairs.message === "error_already_in_other_session") {
          this.props.dispatch(GeneralActions.hideLoaderForSession())
          this.toolbar.showTopToDownAlert("error", "CheckInOut Error", "Student is already with other session!")
        } else if(nextProps.makeStudentAttendanceFromMobileProps.successResponse.nameValuePairs.unregistered_card) {
          this.props.dispatch(GeneralActions.hideLoaderForSession())
          this.toolbar.showTopToDownAlert("error", "CheckInOut Error", "Un-registered card detected!")
        }
        this.props.dispatch(GeneralActions.hideLoaderForSession())
        this.props.dispatch(GeneralActions.clearMarkStudentAttendanceProps())
      // }
     }
      
      if (nextProps.makeStudentAttendanceFromMobileProps.errorResponse) {
        isAPICalled = false;
        this.props.dispatch(GeneralActions.clearMarkStudentAttendanceProps())
          this.props.dispatch(GeneralActions.hideLoaderForSession())
          this.toolbar.showTopToDownAlert("error", "CheckIn/Out Error", "Unable to do CheckIn/Out. Try again.")
      }
      //--removeStudenFromSessionStatusProps update data after this
      if(nextProps.removeStudenFromSessionStatusProps.successResponse) {
          //-- successResponse: 'student_removed_success'
          this.props.dispatch(GeneralActions.clearRemoveStudentNextState())
          // this.setState({isDispatchedAlreadyStarted: false})
          this.startLastSessionApiCall(); //--refresh data
        // }
      }
      
      //--insertStudentAbsenceProps update data after this
      if(nextProps.insertStudentAbsenceProps.successResponse) {
          // if (!_.isEqual(this.props.insertStudentAbsenceProps.successResponse, nextProps.insertStudentAbsenceProps.successResponse)) {
              this.props.dispatch(GeneralActions.clearNextState())
              // this.setState({isDispatchedAlreadyStarted: false})
          // }
      }

      if (nextProps.regretCheckINProps.successResponse) {
        // if (!_.isEqual(this.props.regretCheckINProps.successResponse, nextProps.regretCheckINProps.successResponse)) {
            this.props.dispatch(GeneralActions.clearNextState())
          // this.setState({isDispatchedAlreadyStarted: false})
          // this.startLastSessionApiCall(); //--refresh data
        // }
      }

      if (nextProps.scheduleSessionProps.schedule_session_id) {
        
        if(isImmidiateStartScheduleSession) {
          console.log("sesion starting immediately subjectID:", isImmidiateStartScheduleSubjectID);
          this.toolbar.showTopToDownAlert("info", "Current Session", "Starting your current scheduled session");
          this.dispatchSessionCall(isImmidiateStartScheduleSubjectID)
        } else {
          this.toolbar.showTopToDownAlert("success", I18n.t('LANGUAGE_CONSTANTS.successful'), I18n.t('LANGUAGE_CONSTANTS.schedule_session_success'))
        }
        //--clear this props
        this.props.dispatch(GeneralActions.clearScheduledSessionProps())
      } else if (nextProps.scheduleSessionProps.schedule_session_error) {
        this.toolbar.showTopToDownAlert("info", "Can't Schedule!", "You have already a scheduled session for this time!")
        //--clear this props
        this.props.dispatch(GeneralActions.clearScheduledSessionProps())
      }

      //--adding subject props
      if (nextProps.addSubjectFromMobileProps.successResponse) {
        if (!_.isEqual(this.props.addSubjectFromMobileProps.successResponse, nextProps.addSubjectFromMobileProps.successResponse)) {
          //-- clear addsubject props
          this.props.dispatch(GeneralActions.clearAddSubjectProps())
          this.setState({selectedSheetItem: this.state.dialogInputFieldValueSubjectName})
          this.toolbar.showTopToDownAlert("success", "Successfull", "Subject Added successfully!")
          this.fetchSubjectOfTeacher();
          //--start session for newly added subject
          this.dispatchSessionCall(nextProps.addSubjectFromMobileProps.successResponse.nameValuePairs.new_subject_id)
        } 
      } else if (nextProps.addSubjectFromMobileProps.errorResponse) {
        if (!_.isEqual(this.props.addSubjectFromMobileProps.errorResponse, nextProps.addSubjectFromMobileProps.errorResponse)) {
          this.showAddSubjectError(nextProps.addSubjectFromMobileProps.errorResponse)
          this.props.dispatch(GeneralActions.clearAddSubjectProps())
        }
      }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const differentInSessionProps = !_.isEqual(this.props.startSessionFromMobileProps.successResponse, nextProps.startSessionFromMobileProps.successResponse)
    const differentInSessionDataArray = !_.isEqual(this.props.startSessionFromMobileProps.sessionDataArray, nextProps.startSessionFromMobileProps.sessionDataArray)
    const differentInshowLoaderStatusSession = !_.isEqual(this.props.showLoaderStatusSession, nextProps.showLoaderStatusSession)
    const stateChange = !_.isEqual(nextState, this.state)
    if(differentInSessionProps || differentInSessionDataArray || stateChange || differentInshowLoaderStatusSession) {
      return true
    }
    // return differentLastSessionProps || differentStartSessionProps;
    return false;
  }
  
  _onTagDiscovered = tag => {
    console.log('NFCTag Discovered', tag);
    
    let tagKey = this._parseUri(tag);
    if (tagKey) {
      this._markStudentAttendance(tagKey, true)
    }
}

_startNFCDetection = () => {
    NfcManager.isSupported()
            .then(supported => {
                this.setState({ supported });
                if (supported) {
                  NfcManager.registerTagEvent(this._onTagDiscovered)
                  .then(result => {
                      console.log('registerTagEvent OK', result)
                  })
                  .catch(error => {
                      console.warn('registerTagEvent fail', error)
                  })
                }
            })
    
}

_stopNFCDetection = () => {
    NfcManager.unregisterTagEvent()
        .then(result => {
            console.log('unregisterTagEvent OK', result)
        })
        .catch(error => {
            console.warn('unregisterTagEvent fail', error)
        })
}

  checkIfAnySession = async (subjectID) => {
    console.log('if checkIfAnySession:', subjectID)
    try {
      
        var activeUserData = await AsyncStorage.getItem(ACTIVE_USER_DATA);
        if (activeUserData) {
            //= 0-username, 1-password, 2-userId, 3-schoolId, 4-sysId, 5-role, 6-lateTime, 7-sessionDelay, 8-countDownTime, 9- autoStartFlag
            var separatedData = activeUserData.split("|");

            const WSURL = await AsyncStorage.getItem(SERVICE_URL_KEY);
            console.log('session checkIfAnySession WSURL:', WSURL)
            NetInfo.isConnected.fetch().then((isConnected) => {
                console.log('Network connections is: ' + (isConnected ? 'online' : 'offline'));
                isConnected ?
                this.props.dispatch(SessionAction.checkIfAnySessionForTeacher(WSURL, separatedData[2], subjectID)) //--separatedData[2] --teacherID
                :
                // this.showSnackbar(I18n.t('internet_conn'))
                this.toolbar.showTopToDownAlert("error", "Network Issue", I18n.t('internet_conn'))
            })
        }
    } catch (err) {
        console.log('session checkIfAnySession error in retrieving WSURL')
    }
  }

  fetchAllStudentsOfSchool = async ()=> {
      try {
      
            const WSURL = await AsyncStorage.getItem(SERVICE_URL_KEY);
            console.log('session allStudents WSURL:', WSURL)
            var activeUserData = await AsyncStorage.getItem(ACTIVE_USER_DATA);
          if (activeUserData) {
              //= 0-username, 1-password, 2-userId, 3-schoolId, 4-sysId, 5-role, 6-lateTime, 7-sessionDelay, 8-countDownTime, 9- autoStartFlag
              var separatedData = activeUserData.split("|");  
             
              const WSURL = await AsyncStorage.getItem(SERVICE_URL_KEY);
              console.log('session WSURL:', WSURL)
               NetInfo.isConnected.fetch().then((isConnected) => {
                  console.log('Network connections is: ' + (isConnected ? 'online' : 'offline'));
                  isConnected ?
                  this.props.dispatch(SessionAction.getAllStudentsOfSchool(WSURL, separatedData[2], separatedData[5]))
                  :
                  this.toolbar.showTopToDownAlert("error", "Network Issue", I18n.t('internet_conn'))
              })
          }
      } catch (err) {
          console.log('session allstudents error in retrieving WSURL')
      }
  }

  fetchSubjectOfTeacher = async ()=> {
      try {
      
          var activeUserData = await AsyncStorage.getItem(ACTIVE_USER_DATA);
          if (activeUserData) {
              //= 0-username, 1-password, 2-userId, 3-schoolId, 4-sysId, 5-role, 6-lateTime, 7-sessionDelay, 8-countDownTime, 9- autoStartFlag
              var separatedData = activeUserData.split("|");  
             
              const WSURL = await AsyncStorage.getItem(SERVICE_URL_KEY);
              console.log('session WSURL:', WSURL)
               NetInfo.isConnected.fetch().then((isConnected) => {
                  console.log('Network connections is: ' + (isConnected ? 'online' : 'offline'));
                  isConnected ?
                  this.props.dispatch(getSubjectsOfTeachers(WSURL, separatedData[2]))
                  :
                  // this.showSnackbar(I18n.t('internet_conn'))
                  this.toolbar.showTopToDownAlert("error", "Network Issue", I18n.t('internet_conn'))
              })
          }  

     } catch (err) {
          console.log('session error in retrieving ACTIVE_USER_DATA')
          
      }
  }

  checkTriggerSMS = async (sessionID) => {
    try {
      const triggeredTime = moment().tz('Europe/Berlin').format('YYYY-MM-DD HH:mm:ss')
      var activeUserData = await AsyncStorage.getItem(ACTIVE_USER_DATA);
      if (activeUserData) {
          //= 0-username, 1-password, 2-userId, 3-schoolId, 4-sysId, 5-role, 6-lateTime, 7-sessionDelay, 8-countDownTime, 9- autoStartFlag
          var separatedData = activeUserData.split("|");  
         
          const WSURL = await AsyncStorage.getItem(SERVICE_URL_KEY);
          console.log('session checkTriggerSMS WSURL:', WSURL+sessionID+triggeredTime)
           NetInfo.isConnected.fetch().then((isConnected) => {
              console.log('Network connections is: ' + (isConnected ? 'online' : 'offline'));
              isConnected ?
              this.props.dispatch(SessionAction.triggerSendAbsenceSMS(WSURL, sessionID, triggeredTime, separatedData[2], "192.10.21"))
              :
              // this.showSnackbar(I18n.t('internet_conn'))
              this.toolbar.showTopToDownAlert("error", "Network Issue", I18n.t('internet_conn'))
          })
      } 
    } catch (err) {
          console.log('session error in retrieving ACTIVE_USER_DATA')
          
    }
  }

  pollCommonForMobile = async (sessionID, isSMSSent) => {
    try {
      // WSURL, sessionID, lastPollCheckedINTime, lastPollCheckedOutTime, lastAbsencePollTime, lastSMSPollTime, currentDateTime, isSMSSent
      const lastPollCheckedINTime = ""
      const lastPollCheckedOutTime = ""
      const lastAbsencePollTime = ""
      const lastSMSPollTime = ""
      const currentDateTime = moment().tz('Europe/Berlin').format('YYYY-MM-DD HH:mm:ss')
      // const currentDateTime = currentDateTimeEuropeSTD
         
          const WSURL = await AsyncStorage.getItem(SERVICE_URL_KEY);
          console.log('session pollCommonForMobile WSURL:', WSURL+sessionID)
           NetInfo.isConnected.fetch().then((isConnected) => {
              console.log('Network connections is: ' + (isConnected ? 'online' : 'offline'));
              isConnected ?
              this.props.dispatch(SessionAction.pollCommonForMobile(WSURL, sessionID, lastPollCheckedINTime, lastPollCheckedOutTime, lastAbsencePollTime, 
                lastSMSPollTime, currentDateTime, isSMSSent))
              :
              // this.showSnackbar(I18n.t('internet_conn'))
              this.toolbar.showTopToDownAlert("error", "Network Issue", I18n.t('internet_conn'))
          })
    } catch (err) {
          console.log('session error in retrieving WSURL')
          
    }
  }

    handleRefresh = () => {
      this.setState(
        {
          page: 1,
          seed: this.state.seed + 1,
          refreshing: true
        },
        () => {
          //--make api call
        }
      );
    };
  
    handleLoadMore = () => {
      this.setState(
        {
          page: this.state.page + 1
        },
        () => {
          //--make api call
        }
      );
    };
  
    renderSeparator = () => {
      return (
        <View
          style={{
            height: 1,
            width: "86%",
            backgroundColor: "#CED0CE",
            marginLeft: "14%"
          }}
        />
      );
    };
  
    // renderHeader = () => {
    //   return <SearchBar placeholder="Type Here..." lightTheme round />;
    // };
  
    renderFooter = () => {
      if (!this.state.isLoading) return null;
  
      return (
        <View
          style={{
            paddingVertical: 20,
            borderTopWidth: 1,
            borderColor: "#CED0CE"
          }}
        >
          <ActivityIndicator animating size="large" />
        </View>
      );
    };

_showDateTimePicker = () => this.setState({ isDateTimePickerVisible: true });

_hideDateTimePicker = () => this.setState({ isDateTimePickerVisible: false });

_handleDatePicked = date => {
    console.log("A date has been picked: ", date);
    this._hideDateTimePicker();
};

_updateStartEndSession = (alreadyStarted) => async () =>{
  console.log('session this.state.selectedSheetItem:', this.state.selectedSheetItem)
  if (!alreadyStarted) {

    if (this.state.selectedSheetItem === SELECT_SUBJECT_TITLE) {
      // this.showSnackbar("Please Select any subject!")
      this.toolbar.showTopToDownAlert("error", I18n.t('LANGUAGE_CONSTANTS.select_one_subject'), I18n.t('LANGUAGE_CONSTANTS.please_select_any_subject'))
    } else if (this.state.selectedSheetItem === "Other") {
      //--show add subject dialog
      this.showAddSubjectDialog(true);
    } else {
        this.dispatchSessionCall("")
    }
  } else {
      this.startLastSessionApiCall()
  }
};

startLastSessionApiCall = async () => {
  console.log('session startLastSessionApiCall:')
  try {
    var activeUserData = await AsyncStorage.getItem(ACTIVE_USER_DATA);
        if (activeUserData) {
            //= 0-username, 1-password, 2-userId, 3-schoolId, 4-sysId, 5-role, 6-lateTime, 7-sessionDelay, 8-countDownTime, 9- autoStartFlag
            var separatedData = activeUserData.split("|");  
           
            const WSURL = await AsyncStorage.getItem(SERVICE_URL_KEY);
            console.log('session WSURL:', WSURL)
             NetInfo.isConnected.fetch().then((isConnected) => {
                console.log('Network connections is: ' + (isConnected ? 'online' : 'offline'));
                isConnected ?
                // this.dispatchGetLastSession(WSURL, separatedData[4], separatedData[2])
                this.props.dispatch(SessionAction.getLastContinueSession(WSURL, separatedData[4]))
                :
                // this.showSnackbar(I18n.t('internet_conn'))
                this.toolbar.showTopToDownAlert("error", "Network Issue", I18n.t('internet_conn'))
            })
        } 
    } catch (err) {
    console.log('session allstudents error in retrieving WSURL')
  }
}

startSessionIntentServiceCall = async () => {
  
  try {
    var activeUserData = await AsyncStorage.getItem(ACTIVE_USER_DATA);
        if (activeUserData) {
            //= 0-username, 1-password, 2-userId, 3-schoolId, 4-sysId, 5-role, 6-lateTime, 7-sessionDelay, 8-countDownTime, 9- autoStartFlag
            var separatedData = activeUserData.split("|");  
           
            const WSURL = await AsyncStorage.getItem(SERVICE_URL_KEY);
            console.log('session WSURL:', WSURL)
            NetInfo.isConnected.fetch().then((isConnected) => {
                console.log('Network connections is: ' + (isConnected ? 'online' : 'offline'));
                isConnected ?
                this.props.dispatch(SessionAction.startSessionIntentServiceAction(WSURL, separatedData[4]))
                :
                this.toolbar.showTopToDownAlert("error", "Network Issue", I18n.t('internet_conn'))
            })
        } 
    } catch (err) {
      console.log('session allstudents error in retrieving WSURL')
  }
}

dispatchSessionCall = async (subjectID) => {
  console.log('session dispatchSessionCall subjectID', subjectID)
  this.setState({isSessionEndedSuccessfully: false})

  if (subjectID == null || subjectID === "") {
    for(let i = 0; i < this.props.subjectOfTeacherProps.subjectJsonData.values.length; i += 1) {
      if (this.state.selectedSheetItem === this.props.subjectOfTeacherProps.subjectJsonData.values[i].nameValuePairs.subjectName) {
        subjectID = this.props.subjectOfTeacherProps.subjectJsonData.values[i].nameValuePairs.subjectID //--subjectCode
          console.log('else if subjectID:', subjectID)
      }
    }
  }

  try {
    var activeUserData = await AsyncStorage.getItem(ACTIVE_USER_DATA);
        if (activeUserData) {
            //= 0-username, 1-password, 2-userId, 3-schoolId, 4-sysId, 5-role, 6-lateTime, 7-sessionDelay, 8-countDownTime, 9- autoStartFlag
            var separatedData = activeUserData.split("|");  
           
            const WSURL = await AsyncStorage.getItem(SERVICE_URL_KEY);
            console.log('session WSURL:', WSURL)
             NetInfo.isConnected.fetch().then((isConnected) => {
                console.log('Network connections is: ' + (isConnected ? 'online' : 'offline'));
                isConnected ?
                this.dispatchStartEndNewSession(WSURL, subjectID, separatedData[4], separatedData[2])
                :
                this.toolbar.showTopToDownAlert("error", "Network Issue", I18n.t('internet_conn'))
                
            })
        } 
    } catch (err) {
    console.log('session allstudents error in retrieving WSURL')
  }
}

dispatchStartEndNewSession =(WSURL, subjectID, teacherId, createdBy)=> {
  sessionCreatedTime = moment().tz('Europe/Berlin').format('YYYY-MM-DD HH:mm:ss');
  const currentDateAndTime = moment().tz('Europe/Berlin').format('YYYY-MM-DD HH:mm:ss');
        if (!this.state.sessionStartStatus) {
          isNewSessionStarted = true
          this.props.dispatch(SessionAction.startSessionFromMobile(WSURL, subjectID, "0", teacherId, currentDateAndTime, createdBy, currentDateAndTime, "10.192.67"))
          //--
          // this.checkIfAnySession(subjectID)
        } else {
          // WSURL, sessionID, endTime, modifiedBy, modifiedDataTime, modifiedIp
          const sessionID = this.props.startSessionFromMobileProps.sessionID ? this.props.startSessionFromMobileProps.sessionID : this.state.lastContinueSessionID
          console.log('endSession from mobile sessionID: ' ,sessionID);
          if (sessionID) {
            this.props.dispatch(SessionAction.endSessionFromMobile(WSURL, sessionID, currentDateAndTime, createdBy, currentDateAndTime, "10.192.67"))
          } else {
            this.showSnackbar("Invalid session to End!")
          }
        }
}

showActionSheet = () => () => {
  this.ActionSheet.show()
}

handleActionSheetPress = (buttonIndex) => {
  console.log('buttonIndex:', buttonIndex)
   if ( this.props.subjectOfTeacherProps.subjectOfTeacherSuccessResponse) {
  this.setState({ selectedSheetItem: buttonIndex === -1 ? SELECT_SUBJECT_TITLE : this.props.subjectOfTeacherProps.subjectOfTeacherSuccessResponse[buttonIndex], DESTRUCTIVE_INDEX: buttonIndex })
  console.log('buttonIndex selectedSheetItem:', this.props.subjectOfTeacherProps.subjectOfTeacherSuccessResponse[buttonIndex])
    if (this.props.subjectOfTeacherProps.subjectOfTeacherSuccessResponse[buttonIndex] === 'Other') {
        this.showAddSubjectDialog(true);
    }
  }
}

showAddSubjectDialog = (visible) => {
  this.AddSubjectModal.showModal()
}

showStudentListDialog = (visible) => () => {
  this.StudentModal.showModal()
}

 scheduleSession = () => async() => {
  
  const enteredStartTime = this.state.startTime;
  const enteredEndTime = this.state.endTime;

  const weekDay = moment().format('dddd');
  // const currentDateAndTime = moment().format('YYYY-MM-DD HH:mm')
  const currentDateAndTime = moment().tz('Europe/Berlin').format('YYYY-MM-DD HH:mm:ss')
  const currentTimeInHHMM =  moment().tz('Europe/Berlin').format('HH:mm')

  const duration = moment.duration(moment(enteredEndTime, "HH:mm").diff(moment(enteredStartTime, "HH:mm")));
  const durationHours = duration.asHours();
  const durationInMinutes = duration.asMinutes();

  if (this.state.selectedSheetItem === SELECT_SUBJECT_TITLE) {
    this.toolbar.showTopToDownAlert("error", I18n.t('LANGUAGE_CONSTANTS.select_one_subject'), I18n.t('LANGUAGE_CONSTANTS.please_select_any_subject'))
  } else if (this.state.selectedSheetItem === "Other") {
    //--show add subject dialog
    this.showAddSubjectDialog(true);
  } else {
    for(let i = 0; i < this.props.subjectOfTeacherProps.subjectJsonData.values.length; i += 1) {
      if (this.state.selectedSheetItem === this.props.subjectOfTeacherProps.subjectJsonData.values[i].nameValuePairs.subjectName) {
        const subjectId = this.props.subjectOfTeacherProps.subjectJsonData.values[i].nameValuePairs.subjectID //--subjectCode
          console.log('else if subjectID:', subjectId)
          try {
            if (enteredStartTime.toString() == currentTimeInHHMM.toString()) {
              isImmidiateStartScheduleSession = true; //--set true for starting session immediately
              isImmidiateStartScheduleSubjectID = subjectId;
              console.log('session isImmidiateStartScheduleSession = true: subjectID', isImmidiateStartScheduleSubjectID)
            }
            var activeUserData = await AsyncStorage.getItem(ACTIVE_USER_DATA);
            if (activeUserData) {
                //= 0-username, 1-password, 2-userId, 3-schoolId, 4-sysId, 5-role, 6-lateTime, 7-sessionDelay, 8-countDownTime, 9- autoStartFlag
                var separatedData = activeUserData.split("|");  
                
                const WSURL = await AsyncStorage.getItem(SERVICE_URL_KEY);
                console.log('session WSURL:', WSURL)
                NetInfo.isConnected.fetch().then((isConnected) => {
                    console.log('Network connections is: ' + (isConnected ? 'online' : 'offline'));
                    isConnected ?
                    this.props.dispatch(SessionAction.scheduleSessionForTeacher(WSURL, subjectId, enteredStartTime, enteredEndTime, durationInMinutes, 
                      weekDay, separatedData[3], separatedData[2], currentDateAndTime, "192.10.144"))
                    :
                    // this.showSnackbar(I18n.t('internet_conn'))
                    this.toolbar.showTopToDownAlert("error", "Network Issue", I18n.t('internet_conn'))
                })
            }  
      
          } catch (err) {
            console.log('session error in retrieving ACTIVE_USER_DATA')
            
          }
      }
    }
  } //--end of else
}

startCurrentSession = async (scheduleId)=> {
  //
  try {
    await AsyncStorage.setItem(SCHEDULED_SESSION_ID, scheduleId)
    console.log("scheduledId saved:", scheduleId)
  } catch (err) {
    console.log("error in saving scheduledId saved:", err)
  }

  const currentDateAndTime = moment().tz('Europe/Berlin').format('YYYY-MM-DD HH:mm:ss')
  
  try {
          
    var activeUserData = await AsyncStorage.getItem(ACTIVE_USER_DATA);
    if (activeUserData) {
        //= 0-username, 1-password, 2-userId, 3-schoolId, 4-sysId, 5-role, 6-lateTime, 7-sessionDelay, 8-countDownTime, 9- autoStartFlag
        var separatedData = activeUserData.split("|");  
        const createdBy = separatedData[2]
        const WSURL = await AsyncStorage.getItem(SERVICE_URL_KEY);
        console.log('session WSURL createdBy:', WSURL+createdBy)
        NetInfo.isConnected.fetch().then((isConnected) => {
            console.log('Network connections is: ' + (isConnected ? 'online' : 'offline'));
            isConnected ?
            this.props.dispatch(SessionAction.startCurrentScheduledSession( WSURL, scheduleId, "0", createdBy, currentDateAndTime, "192.10.144"))
            :
            // this.showSnackbar(I18n.t('internet_conn'))
            this.toolbar.showTopToDownAlert("error", "Network Issue", I18n.t('internet_conn'))
        })
    }  

  } catch (err) {
    console.log('session error in retrieving ACTIVE_USER_DATA')
    
  }
}

_updateCorrectTime = (timeType) => {
  if (timeType === "start") {
    this.setState({startTime: this.state.startTime})
  } else {
    this.setState({endTime : this.state.endTime})
  }
}

_updateErrorTime = (timeType) => {
  let message = ""
  if (timeType === "start") {
    message = "Start time should be after the current time."

    this.setState({startTime: moment().format('HH:mm')})
  } else {
    message = "End time should be after the current time."

    this.setState({endTime: moment().subtract(1,'days').endOf('day').format('HH:mm').toString()})
  }
}

handleSubjectDialog = (visible) => {
  this.setState({add_subject_alert_visibility: visible});
}

addSubjectAndStartSession = () => () => {
  
  console.log('subjectDetails entered name:', this.state.dialogInputFieldValueSubjectName)
  if(this.state.dialogInputFieldValueSubjectName.length > 0) {
    if(this.state.dialogInputFieldValueSubjectCode.length > 0) {
      if(this.state.listOfSelectedStudentIDs.length > 0) {
        this.AddSubjectModal.hideModal()
        //TODO--call add subject API:
        this.dispatchAddSubjectCall()
      } else {
        this.AddSubjectModal.showTopToDownAlert("error", "Alert", "Please Select at least one student.")
      }
    } else {
      this.AddSubjectModal.showTopToDownAlert("error", "Alert", "Please Enter subject code.")
    }
  } else {
    this.AddSubjectModal.showTopToDownAlert("error", "Alert", "Please Enter subject name.")
  }
}

dispatchAddSubjectCall = async () => {
  const newSubjectName = this.state.dialogInputFieldValueSubjectName;
  const newSubjectCode = this.state.dialogInputFieldValueSubjectCode;
  const studentsIDs = this.state.listOfSelectedStudentIDs;
  const createdDataTime = moment().format('YYYY-MM-DD HH:mm:ss');
  try {
    var activeUserData = await AsyncStorage.getItem(ACTIVE_USER_DATA);
        if (activeUserData) {
            //= 0-username, 1-password, 2-userId, 3-schoolId, 4-sysId, 5-role, 6-lateTime, 7-sessionDelay, 8-countDownTime, 9- autoStartFlag
            // params::WSURL, newSubjectName, newSubjectCode,  studentsIDs, createdBy, createdDateTime, createdIp
            var separatedData = activeUserData.split("|");

            const WSURL = await AsyncStorage.getItem(SERVICE_URL_KEY);
            console.log('session WSURL:', WSURL)
             NetInfo.isConnected.fetch().then((isConnected) => {
                console.log('Network connections is: ' + (isConnected ? 'online' : 'offline'));
                isConnected ?
                this.props.dispatch(SessionAction.addSubjectFromMobile(WSURL, newSubjectName, newSubjectCode,
                  studentsIDs.toString().substring(0, studentsIDs.toString().length), separatedData[2], createdDataTime.toString(), "192.12.07"))
                :
                // this.showSnackbar(I18n.t('internet_conn'))
                this.toolbar.showTopToDownAlert("error", "Network Issue", I18n.t('internet_conn'))
            })
        }
    } catch (err) {
    console.log('session dispatchAddSubjectCall error in retrieving WSURL')
  }
}

showAddSubjectError = (errorType) => {
  if (errorType.toString().indexOf('subject_error_2') != -1) {
    this.toolbar.showTopToDownAlert("error", "ERROR", I18n.t('LANGUAGE_CONSTANTS.ImportSubject_err2'))
  } else if (errorType.toString().indexOf('subject_error_3') != -1) {
    this.toolbar.showTopToDownAlert("error", "ERROR", I18n.t('LANGUAGE_CONSTANTS.ImportSubject_err3'))
  } else if (errorType.toString().indexOf('subject_error_4') != -1) {
    this.toolbar.showTopToDownAlert("error", "ERROR", I18n.t('LANGUAGE_CONSTANTS.ImportSubject_err4'))
  } else if (errorType.toString().indexOf('Error_else_false') != -1) {
    this.toolbar.showTopToDownAlert("error", "ERROR", I18n.t('LANGUAGE_CONSTANTS.error'))
  } else {
    this.toolbar.showTopToDownAlert("error", "Network Error", I18n.t('internet_conn'))
  }
}

handleStudentListDialog = (visible) => {
  this.setState({student_list_alert_visibility: visible});
}

onStudentListDialogDonePress = () => () => {
  const { listOfSelectedStudentIDs, listOfSelectedStudents, isAllStudentsSelected } = this.state;
  const listOfSelectedIDs = []
  
  console.log('onStudentListDialogDonePress listOfSelectedStudents:', listOfSelectedStudents);

  if (listOfSelectedStudents.length > 0) {
    console.log('onStudentListDialogDonePress listOfSelectedStudents.toString():', listOfSelectedStudents.toString());
    this.setState({ studentListDialogSubmitButtonTitle: listOfSelectedStudents.toString()})

    for(let j = 0; j < this.props.getAllStudentsProps.getAllStudentsSuccessReponse.length; j += 1) {

      if(listOfSelectedStudents.includes(this.props.getAllStudentsProps.getAllStudentsSuccessReponse[j].nameValuePairs.student_name)) {
        listOfSelectedIDs.push(this.props.getAllStudentsProps.getAllStudentsSuccessReponse[j].nameValuePairs.student_id)
      } //--end of if

    } //--end of for 
  } //--end of if length > 0
  this.setState({ listOfSelectedStudentIDs: listOfSelectedIDs})
  // this.StudentModal.hideModal()
  console.log('onStudentListDialogDonePress listOfSelectedStudentIDs:', listOfSelectedStudentIDs.toString());
}

handleScannedClick = () => () => {
  // Linking.openURL('app-settings:')
  if (this.state.isSessionStarted == false) {
    // this.showSnackbar("No Session going-on. Start a session first.")
    this.toolbar.showTopToDownAlert("info", "Info", "No Session going-on. Start a session first.")
  } else {
    // this.props.dispatch(NavigateToRNCamera())
    // this.ScannerModal.showModal()
    if (Platform.OS === 'android') {
      this.handleAndroidCameraPermission()
    } else if(Platform.OS === 'ios') {
      this.handleIOSCameraPermission();
    }
  }
}

handleIOSCameraPermission =()=> {
  Permissions.request('camera').then(response => {
    // Returns once the user has chosen to 'allow' or to 'not allow' access
  // Response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
    if(response === 'authorized') {
      this.ScannerModal.showModal()
    } else if(response === 'denied'){
      this.toolbar.showTopToDownAlert("info", "Info", "Please allow the camera permission.")
    } else if(response === 'denied') {
      //--TODO goto setting
    } else if(response === 'undetermined') {
     this.handleIOSCameraPermission(); 
    }
  });
}
handleAndroidCameraPermission = async ()=> {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        'title': 'Camera Permission Required',
        'message': 'Consat App needs access to your camera ' +
                   'so you can use the scanner.'
      }
    )
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log("You can use the camera")
      this.ScannerModal.showModal()
    } else {
      this.toolbar.showTopToDownAlert("info", "Info", "Please allow the camera permission.")
    }
  } catch (err) {
    console.warn(err)
    this.toolbar.showTopToDownAlert("error", "Permission Error", "Try again for the camera permission.")
  }
}

showSnackbar = (message) => {
  // ToastAndroid.show(message, ToastAndroid.SHORT);
  this.refs.custom_snackbar.show(message)
}

runAnimation() {
  var startVal = 0;
  var endVal = 1;
  
  this.fadeAnim.setValue(startVal);
  Animated.timing(this.fadeAnim, {
    toValue: endVal,
    duration: 10000,
  }).start(() => this.runBackAnimation());
}

runBackAnimation() {
  var startVal = 1;
  var endVal = 0;
  
  this.fadeAnim.setValue(startVal);
  Animated.timing(this.fadeAnim, {
    toValue: endVal,
    duration: 10000,
  }).start(() => this.runAnimation());
}

renderEachStudentView = (item, index) => {
  
  // console.log('render currentSession Each item:', item);
  let iconURL, studentID, studentName, studentLastIn, studentLastOut, studentAttendance, 
  checkInStatusValue, alertStatus, avatarBorderColorValue, isCheckedIn, isBusy,
  checkedInButtonBgCcolor, checkedOutButtonBgCcolor, isCheckedInButtonDisable, isCheckedOutButtonDisable,
  hashKeyValue, sentCount, replyCount, busyWithSubjectTitle,
  parent1Title, parent1TitleValue , parent2Title, parent2TitleValue, 
  leavFromTitle = "", leaveUptoTitle = "", sickLeavFromTitleValue, sickLeaveUptoTitleValue, sickLeaveType ="Sick Leave";
  let cardborderColorDefault = "#000"
  let cardborderColor = "#FFF"
  let viewBorderColorParent1 = "#F00"
  let viewBorderColorParent2 = "#F00"

  if(item.ID) {
    studentID = item.ID;
    studentName = item.NAME ? item.NAME: "Anonymous";
    studentLastIn = item.PunchIn;
    studentLastOut = item.PunchOut;
    studentAttendance = item.attendance;
    checkInStatusValue = parseInt(item.checkIn_status);
    alertStatus = parseInt(item.alert_status);
    sickLeavFromTitleValue = item.leave_from !== '' ? moment.utc(new Date(item.leave_from)).tz('Europe/Berlin').format("YYYY-MM-DD HH:mm") : null;
    sickLeaveUptoTitleValue = item.leave_upto !== '' ? moment.utc(new Date(item.leave_upto)).tz('Europe/Berlin').format("YYYY-MM-DD HH:mm") : null;
    // sickLeaveType = item.leave_type
    hashKeyValue = item.hash_key
    // hashKeyValue = item.card_key;
    sentCount = item.SentCount;
    replyCount = item.ReplyCount;
    iconURL = WEB_KEY_URL_VALUE + IMAGE_URL_PATH + item.ID;
    avatarBorderColorValue = this.state.avatarBorderColor;
   //--leave type
   if(item.leave_type) {
     if(parseInt(item.leave_type) === 1) {
      leavFromTitle = "Sick Leave From: "
      leaveUptoTitle = "Sick Leave Upto: "
      sickLeaveType = "Sick Leave"
     } else if(parseInt(item.leave_type) === 17) {
      leavFromTitle = "Extra Curricular Activity From: "
      leaveUptoTitle = "Extra Curricular Activity Upto: "
      sickLeaveType = "School Activity"
     }
   }
    if(item.checkIn_subjectName) {
      busyWithSubjectTitle = "BUSY: Attending " +item.checkIn_subjectName +" class";
    }
   //--checking parent sms info:
    if (item.parent1_smsData) {
      if(item.parent1_smsData.nameValuePairs) {
        parent1Title = item.parent1_smsData.nameValuePairs.parent1_name + ": "; 
        parent1TitleValue = item.parent1_smsData.nameValuePairs.parent1_status + " At " 
              + moment.utc(new Date(item.parent1_smsData.nameValuePairs.parent1_time)).tz('Europe/Berlin').format("HH:mm");
      } else { //moment().tz('Europe/Berlin').format('YYYY-MM-DD HH:mm:ss')
        parent1Title = item.parent1_smsData.parent1_name + ": "; 
        parent1TitleValue = item.parent1_smsData.parent1_status + " At " 
              + moment.utc(new Date(item.parent1_smsData.parent1_time)).tz('Europe/Berlin').format("HH:mm");
      }
      //--for enable blinking anim
      if(checkInStatusValue === 1) {
        if (parseInt(item.parent1_smsData.parent1_replyCount) === 0) {
          viewBorderColorParent1 = "#F00";
        }
      } else {
        viewBorderColorParent1 = "#FFF";
      }
    }
    
    if (item.parent2_smsData) {
      if(item.parent2_smsData.nameValuePairs) {
        parent2Title = item.parent2_smsData.nameValuePairs.parent2_name + ": ";
        parent2TitleValue = item.parent2_smsData.nameValuePairs.parent2_status + " At " 
              + moment.utc(new Date(item.parent2_smsData.nameValuePairs.parent2_time)).tz('Europe/Berlin').format("HH:mm");
      } else {
        parent2Title = item.parent2_smsData.parent2_name + ": ";
        parent2TitleValue = item.parent2_smsData.parent2_status + " At " 
              + moment.utc(new Date(item.parent2_smsData.parent2_time)).tz('Europe/Berlin').format("HH:mm");
      }
      //--for enable blinking anim
      if(checkInStatusValue === 1) {
        if (parseInt(item.parent2_smsData.parent2_replyCount) === 0) {
          viewBorderColorParent2 = "#F00";
        }
      } else {
        viewBorderColorParent2 = "#FFF";
      }
    }
    
  if (parseInt(sentCount) > 0 && parseInt(replyCount) < 1 && checkInStatusValue === 1 ) {
    cardborderColor = "#F00";
    cardborderColorDefault = "#FFF";
  }
  // //--start animation
  // if(viewBorderColorParent1 === "#F00" || cardborderColor === "#F00") {
  //   // this.runAnimation()
  // }

  // if(viewBorderColorParent2 === "#F00") {
  //   // this.runBackAnimation()
  // }
  // this.runAnimation()
    switch(checkInStatusValue) {
      case 1:
        avatarBorderColorValue = '#E40B0B'; //--red for no checkIn
        isCheckedIn = false;
        isBusy = false;
        checkedInButtonBgCcolor = 'rgba(92, 99,216, 1)';
        checkedOutButtonBgCcolor = 'rgb(96, 125, 139)';
        isCheckedInButtonDisable = false;
        isCheckedOutButtonDisable = true;
      break;
      case 2:
        avatarBorderColorValue = '#00FF00'; //--green for checkIn
        isCheckedIn = true;
        isBusy = false;
        checkedInButtonBgCcolor = 'rgb(96, 125, 139)';
        checkedOutButtonBgCcolor = 'rgba(92, 99,216, 1)';
        isCheckedInButtonDisable = true;
        isCheckedOutButtonDisable = false;
      break;
      case 3:
        avatarBorderColorValue = '#0000FF'; //--blue for early checkOut
        isCheckedIn = false;
        isBusy = false;
        checkedInButtonBgCcolor = 'rgba(92, 99,216, 1)';
        checkedOutButtonBgCcolor = 'rgb(96, 125, 139)';
        isCheckedInButtonDisable = false;
        isCheckedOutButtonDisable = true;
      break;
      case 4:
        avatarBorderColorValue = '#B9B8B8'; //--grey for absence
        isCheckedIn = false;
        isBusy = false;
        checkedInButtonBgCcolor = 'rgba(92, 99,216, 1)';
        checkedOutButtonBgCcolor = 'rgb(96, 125, 139)';
        isCheckedInButtonDisable = false;
        isCheckedOutButtonDisable = true;
      break;
      case 5:
        avatarBorderColorValue = '#e242f4'; //--pink for busy
        isCheckedIn = false;
        isBusy = true;
        checkedInButtonBgCcolor = 'rgb(96, 125, 139)';
        checkedOutButtonBgCcolor = 'rgb(96, 125, 139)';
        isCheckedInButtonDisable = true;
        isCheckedOutButtonDisable = true;
      break;
      default:
      break;
    }
    
  return (
    
  <Card containerStyle={{ flex:1, flexDirection: 'column', width: SCREEN_WIDTH-40, padding: 0, 
    marginLeft:5, marginRight:5,
    borderRadius: 2,
    borderColor: cardborderColorDefault,
    }}>
    
        <Animatable.View 
            animation="fadeOut"
            useNativeDriver
            iterationCount='infinite'
            direction="alternate"
            // delay={2000}
            style={{flex: 1,
              // justifyContent: 'center',
              width: "100%",
              height:"100%",
            alignItems: 'center',
            borderColor: cardborderColor,
            flexDirection:'row',
            position: 'absolute',
            borderRadius: 2,
            borderWidth: 1,
            }}
        >
        </Animatable.View>
    {/* <Animatable.View animation="fadeIn" iterationCount={"infinite"} direction="alternate"
      style={{flex: 1, borderColor: bColor, borderRadius: 2,}}> */}
    <View style={{flex: 0.1, flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:10}}>
    
      <Text style={[styles.listItemHeaderTitle, {flex:0.8, padding:0 , marginLeft:2, alignItems:'center'}]} 
        numberOfLines={1} ellipsizeMode={'tail'}>
        {studentName} 
        </Text>
      <TouchableOpacity style={{ flex:0.2, alignSelf: 'flex-end', alignItems:'center', padding:0, borderRadius:5, backgroundColor: '#FFF' }} 
        activeOpacity = { 0.5 } 
        onPress={this.showRemoveDialog(true, studentID, studentName)} >
        <Image
          style={{height:24, width: 24, padding:2, justifyContent: 'center', alignSelf:'flex-end', marginRight:2}}
          source={images.iconCircularCloseButton}
        />
      </TouchableOpacity>

    </View>
    <View style={{height:1, backgroundColor:'black' }}/>
  
      <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start', height:150, padding:10}}>
       <View style={{flexDirection: 'column', width:80, justifyContent: 'center', alignItems: 'center'}}>
        <View style={[styles.avatarContainerStyle, {marginLeft:5, borderWidth: 2, borderRadius: 10, borderColor: avatarBorderColorValue, padding:5, alignItems:'center'}]}>
          <Image
              // source={{uri: iconURL}}
              source = { this.state.listAvatarLoading ? { uri: iconURL } : images.iconNoUser}
              style={[styles.avatarContainerStyle, {width: 75, height: 75, borderRadius: 10, resizeMode: 'contain'}]}
              onError={this.onImageLoadingError}
            />
        </View>
          <MarqueeText
              // style={{ fontWeight: 'bold',color:"#FFF", justifyContent: 'center', alignSelf: 'center' }}
              style={[styles.listItemSubTitle, {color:"#F00"}]}
              duration={3000}
              marqueeOnStart
              loop
              marqueeDelay={500}
              marqueeResetDelay={500}
              >
              {busyWithSubjectTitle}
          </MarqueeText>
        </View>
      <View style={{flex:1, marginLeft: 10,  flexDirection: 'column', justifyContent: 'flex-start', width:"100%" }}>
        <View style={{flexDirection: 'row',justifyContent: 'flex-start', alignItems: 'flex-start' }}>
       
          <Text style={styles.listItemTitle} numberOfLines={1} ellipsizeMode={'tail'}>{I18n.t('LANGUAGE_CONSTANTS.last_in')}</Text>
          {/* <Text style={styles.listItemSubTitle} numberOfLines={1} ellipsizeMode={'tail'}>{I18n.t('LANGUAGE_CONSTANTS.last_in')} {studentLastIn ? studentLastIn : " --"}</Text> */}
          <MarqueeText
              // style={{ fontWeight: 'bold',color:"#FFF", justifyContent: 'center', alignSelf: 'center' }}
              style={[styles.listItemSubTitle, {flex:1, justifyContent:'flex-start'}]}
              duration={3000}
              marqueeOnStart
              loop
              marqueeDelay={500}
              marqueeResetDelay={500}
              >
              {studentLastIn ? studentLastIn : " --"}
          </MarqueeText>
        </View>

        <View style={{flexDirection: 'row',justifyContent: 'flex-start', alignItems: 'flex-start'}}>
          <Text style={styles.listItemTitle} numberOfLines={1} ellipsizeMode={'tail'}>{I18n.t('LANGUAGE_CONSTANTS.last_out')}</Text>
          <MarqueeText
              style={[styles.listItemSubTitle, {flex:1, justifyContent:'flex-start'}]}
              duration={3000}
              marqueeOnStart
              loop
              marqueeDelay={500}
              marqueeResetDelay={500}
              >
              {studentLastOut ? studentLastOut : " --"}
          </MarqueeText>
        </View>

        <View style={{flexDirection: 'row',justifyContent: 'flex-start', alignItems: 'flex-start'}}>
          <Text style={styles.listItemTitle} numberOfLines={1} ellipsizeMode={'tail'}>{I18n.t('LANGUAGE_CONSTANTS.attandence')}</Text>
          <MarqueeText
              style={[styles.listItemSubTitle, {flex:1, justifyContent:'flex-start'}]}
              duration={3000}
              marqueeOnStart
              loop
              marqueeDelay={500}
              marqueeResetDelay={500}
              >
              {studentAttendance ? studentAttendance : " 0.00%"}
          </MarqueeText>
        </View>
        {
          parent1Title ? 
          <View style={{flexDirection: 'row',justifyContent: 'flex-start', alignItems: 'flex-start'}}>
          {/* <Animated.View style={{flex: 1,
            // justifyContent: 'center',
            alignItems: 'center',
            borderColor: viewBorderColorParent1,
            flexDirection:'row',
            position: 'absolute',
            borderRadius: 2,
            borderWidth: 0.5,
            top:0,
            left:0,
            right:0,
            bottom:0,
            opacity: this.fadeAnim}}>
          </Animated.View> */}
          <Animatable.View 
            animation="fadeIn"
            useNativeDriver
            iterationCount='infinite'
            direction="alternate"
            // delay={2000}
            style={{flex: 1,
              // justifyContent: 'center',
              alignItems: 'center',
              borderColor: viewBorderColorParent1,
              flexDirection:'row',
              position: 'absolute',
              borderRadius: 2,
              borderWidth: 1,
              top:0,
              left:0,
              right:0,
              bottom:0,
            }}>
          </Animatable.View>
          <Text style={styles.listItemTitle} numberOfLines={1} ellipsizeMode={'tail'}>{parent1Title}</Text>
          <MarqueeText
              style={[styles.listItemSubTitle, {flex:1, justifyContent:'flex-start'}]}
              duration={3000}
              marqueeOnStart
              loop
              marqueeDelay={500}
              marqueeResetDelay={500}
              >
              {parent1TitleValue}
          </MarqueeText>
        </View>
        : null
        }
        
        {
          parent2Title ? 
          <View style={{flexDirection: 'row',justifyContent: 'flex-start', alignItems: 'flex-start'}}>
          <Animatable.View 
            animation="fadeOut"
            useNativeDriver
            iterationCount='infinite'
            direction="alternate"
            // delay={2000}
            style={{flex: 1,
              // justifyContent: 'center',
              alignItems: 'center',
              borderColor: viewBorderColorParent2,
              flexDirection:'row',
              position: 'absolute',
              borderRadius: 2,
              borderWidth: 1,
              top:0,
              left:0,
              right:0,
              bottom:0,
            }}>
          </Animatable.View>
          <Text style={styles.listItemTitle} numberOfLines={1} ellipsizeMode={'tail'}>{parent2Title}</Text>
          <MarqueeText
              style={[styles.listItemSubTitle, {flex:1, justifyContent:'flex-start'}]}
              duration={3000}
              marqueeOnStart
              loop
              marqueeDelay={500}
              marqueeResetDelay={500}
              >
              {parent2TitleValue}
          </MarqueeText>
        </View>
        : null
        }
        {
          ((sickLeavFromTitleValue) && (checkInStatusValue === 4)) ?
          <View style={{width:"80%",flexDirection: 'row',justifyContent: 'flex-start', alignItems: 'flex-start'}}>
          <Text style={[styles.listItemTitle]} numberOfLines={1} ellipsizeMode={'tail'}>{leavFromTitle}</Text>
          <Text style={[styles.listItemSubTitle]} numberOfLines={2}>{sickLeavFromTitleValue}</Text>
          {/* <MarqueeText
              style={[styles.listItemSubTitle]}
              duration={3000}
              marqueeOnStart
              loop
              marqueeDelay={500}
              marqueeResetDelay={500}
              useNativeDriver={true}
              >
              {sickLeavFromTitleValue}
          </MarqueeText> */}
        </View>
        : null
        }
        {
          ((sickLeaveUptoTitleValue) && (checkInStatusValue === 4)) ?
          <View style={{width:"80%",flexDirection: 'row',justifyContent: 'flex-start', alignItems: 'flex-start'}}>
            <Text style={styles.listItemTitle} numberOfLines={1} ellipsizeMode={'tail'}>{leaveUptoTitle}</Text>
            <MarqueeText
                style={[styles.listItemSubTitle]}
                duration={3000}
                marqueeOnStart
                loop
                marqueeDelay={500}
                marqueeResetDelay={500}
                useNativeDriver={true}
                >
                {sickLeaveUptoTitleValue}
            </MarqueeText>
          </View>
          : null
        }
      </View>  
      </View>
      <View style={{flexDirection:'column',  height:1, backgroundColor:'black'}}/>
        <View style={{flex: 0.1, flexDirection:'row',justifyContent:'center',alignItems:'center', height: 40}}>
   
        <TouchableOpacity key={item.id} style={{ alignSelf: 'center', justifyContent:'center', margin:5, borderRadius:5,backgroundColor: '#FFF' }}
          activeOpacity = { .5 } 
          onPress={this._onStudentsCardItemClick("INFORMATION", studentID, studentName, "", "", "")} >
          <Image
            style={{height:24, width: 24, padding:3, marginLeft:2, marginRight:2}}
            source={images.icInfo}
          />
        </TouchableOpacity>
    
      {checkInStatusValue === 1 ?
        <TouchableOpacity key={item.id} style={{ alignSelf: 'center', justifyContent:'center', margin:10, borderRadius:5,backgroundColor: '#FFF' }} 
          activeOpacity = { .5 } 
          onPress={this._onStudentsCardItemClick("HOME_SICK", studentID, studentName, "", "", "")} >
          <Image
            style={{height:24, width: 24, padding:3, marginLeft:2, marginRight:2}}
            source={images.icHomeSick}
          />
        </TouchableOpacity>
      :
      null
      }
      {(checkInStatusValue === 1) ?
        <TouchableOpacity key={item.id} style={{ alignSelf: 'center', justifyContent:'center',margin:10, borderRadius:5,backgroundColor: '#FFF' }} 
          activeOpacity = { .5 } 
          onPress={this._onStudentsCardItemClick("SCHOOL_ACTIVITY", studentID, studentName, "", "", "")} >
          <Image
            style={{height:24, width: 24, padding:3, marginLeft:2, marginRight:2}}
            source={images.icSchoolActivity}
          />
        </TouchableOpacity>
      :
      null
      }
      {((checkInStatusValue === 2) || (checkInStatusValue === 3)) ?
        <TouchableOpacity key={item.id} style={{ alignSelf: 'center', justifyContent:'center',margin:10, borderRadius:5,backgroundColor: '#FFF' }} 
          activeOpacity = { .5 } 
          onPress={this._onStudentsCardItemClick("UNDO", studentID, studentName, "", "", "")} >
          <Image
            style={{height:24, width: 24, padding:3, marginLeft:2, marginRight:2}}
            source={images.icUndo}
          />
        </TouchableOpacity>
      :
      null
      }
      {checkInStatusValue === -1 ?
        <TouchableOpacity key={item.id} style={{ alignSelf: 'center', justifyContent:'center', margin:10, borderRadius:5,backgroundColor: '#FFF' }} 
          activeOpacity = { .5 } 
          onPress={this._onStudentsCardItemClick("EMAIL1", studentID, studentName, "", "", "")} >
          <Image
            style={{height:24, width: 24, padding:3, marginLeft:2, marginRight:2}}
            source={images.iconEmailGreen}
          />
        </TouchableOpacity>
      :
      null}
      {alertStatus == 1 ?
        <TouchableOpacity key={item.id} style={{ alignSelf: 'center', justifyContent:'center', margin:10, borderRadius:5,backgroundColor: '#FFF' }} 
          activeOpacity = { .5 } 
          onPress={this._onStudentsCardItemClick("ALERT", studentID, studentName, sickLeavFromTitleValue, sickLeaveUptoTitleValue, sickLeaveType)} >
          <Image
            style={{height:24, width: 24, padding:3, marginLeft:2, marginRight:2}}
            source={images.icAlert}
          />
        </TouchableOpacity>
      :
      null}
    
      </View>
      <View style={{height:1, backgroundColor:'black'}}/>

      <View style={{flex: 0.1, flexDirection:'row', marginLeft:25, marginRight:25, justifyContent: 'center', alignItems:'center',padding:5, height: 60}}>
        <Button
            text="Check In"
            loading={false}
            textStyle={{ fontWeight: "300" }}
            buttonStyle={{
                backgroundColor: checkedInButtonBgCcolor,
                width: 150,
                height: 40,
                borderColor: "transparent",
                borderWidth: 0,
                borderRadius: 20,
                padding:5,
                marginRight:5
                }}
            containerStyle={{  margin: 1 }}
            disabled={isCheckedInButtonDisable}
            onPress={this._onCheckInOutBtnPress(hashKeyValue)}
            // onPress={() => { if(isAPICalled === false) {
            //   isAPICalled = true;
            //   this._markStudentAttendance(hashKeyValue, false)
            // }}}
        />
        <Button
            text="Check Out"
            loading={false}
            textStyle={{ fontWeight: "300" }}
            buttonStyle={{
                backgroundColor: checkedOutButtonBgCcolor,
                width: 150,
                height: 40,
                borderColor: "transparent",
                borderWidth: 0,
                borderRadius: 20,
                padding:5,
                marginLeft:5
                }}
            containerStyle={{  margin: 1 }}
            disabled={isCheckedOutButtonDisable}
            onPress={this._onCheckInOutBtnPress(hashKeyValue)}
            // onPress={() => { if(isAPICalled === false) {
            //   isAPICalled = true;
            //   this._markStudentAttendance(hashKeyValue, false)
            // }}}
        />
       
     </View>
     {/* <View style={{height:1, backgroundColor:'black'}}/> */}
  {/* </Animatable.View> */}
</Card>
)
  }
}

onImageLoadingError = () => {
  this.setState({ listAvatarLoading: false });
}

_onCheckInOutBtnPress = (hashKeyValue) => (e) => {
  { if(isAPICalled === false) {
    isAPICalled = true;
    this._markStudentAttendance(hashKeyValue, false)
  }}
}

_markStudentAttendance = async (hasKey, isFromNFCQR) => {

  try {
    const sessionID = this.props.startSessionFromMobileProps.sessionID
    //  const checkInTime = moment().format('YYYY-MM-DD HH:mm:ss');
     const checkInTime = moment().tz('Europe/Berlin').format('YYYY-MM-DD HH:mm:ss');
     if (sessionID) {
      const WSURL = await AsyncStorage.getItem(SERVICE_URL_KEY);
      console.log('session _markStudentAttendance checkInTime:', checkInTime+": haskey:"+hasKey)
       NetInfo.isConnected.fetch().then((isConnected) => {
          console.log('Network connections is: ' + (isConnected ? 'online' : 'offline'));
          isConnected ?
          this.props.dispatch(SessionAction.makeStudentAttendanceFromMobile(WSURL, sessionID, hasKey, checkInTime, isFromNFCQR))
          :
          // this.showSnackbar(I18n.t('internet_conn'))
          this.toolbar.showTopToDownAlert("error", "Network Issue", I18n.t('internet_conn'))
      })
     } else {
      this.toolbar.showTopToDownAlert("error", "Error", "Session Id not found")
     }
    } catch (err) {
    console.log('session _markStudentAttendance error in retrieving WSURL')
  }
};


showRemoveDialog = (visible, studentRemoveId, studentRemoveName) => (e) => {
  console.log('Session showRemoveDialog studentRemoveId:', studentRemoveId)
  this.setState({
    alert_visibility: visible,
    studentIDToBeOperated: studentRemoveId,
    alertTitle: "Confirmation",
    alertBody:"Do you really want to unregister " + studentRemoveName+ " from this Subject?",
    submitButtonText: "Yes, Remove!"
  })
}

showHomSickDialog = (visible, studentSickId, studentSickName) => {
  console.log('Session showHomSickDialog studentSickId:', studentSickId)
  this.setState({
    alert_visibility: visible,
    studentIDToBeOperated: studentSickId,
    alertTitle: "Confirmation",
    alertBody:"Are you sure you want to report sick of " + studentSickName+ " ?",
    submitButtonText: "Send SMS"
  })
}

showUndoSickDialog = (visible, studentUndoId, studentUndoName) => {
  console.log('Session showUndoSickDialog studentSickId:', studentUndoId)
  this.setState({
    alert_visibility: visible,
    studentIDToBeOperated: studentUndoId,
    alertTitle: "Confirmation",
    alertBody:"Sure, you want to regret Check In of " + studentUndoName+ " ?",
    submitButtonText: "Yes, Regret CheckIn!"
  })
}

showSchoolActivityDialog = (visible, studentId, studentName) => {
  console.log('Session showSchoolActivityDialog studentSickId:', studentId)
  this.setState({
    alert_visibility: visible,
    studentIDToBeOperated: studentId,
    alertTitle: "Confirmation",
    alertBody:"Sure, you want to report Extra curricular activity of " + studentName+ " ?",
    submitButtonText: "Yes, Report!"
  })
}

showContinueOtherSessionDialog = (visible, teacherId) => {
  console.log('Session showHomSickDialog studentSickId:', studentSickId)
  this.setState({
    alert_visibility: visible,
    studentIDToBeOperated: studentSickId,
    alertTitle: "Alert",
    alertBody: I18n.t('LANGUAGE_CONSTANTS.msg_session_found_for_same_sub'),
    submitButtonText: "Yes, Continue!"
  })
}

handleDialogVisiblity = (visible) => () => {
  this.setState({alert_visibility: visible});
}

handleOnSubmitPress = () => () => {
  
  switch(this.state.submitButtonText) {
    case "Yes, Remove!":
      this.deleteStudent();
        break;
    case "Send SMS":
        this.sendAbsenceSickSMS();
        break;
    case "Yes, Report!":
        this.reportSchoolActivity();
        break;
    case "Yes, Regret CheckIn!":
        this.regretCheckIn();
        break;
    default:
        break;
  }
}

_onStudentsCardItemClick = (itemType, student_id, student_Name, leaveFrom, leaveUpto, leaveType) => (e) => {
  
  switch(itemType) {
    case "INFORMATION":
      if(AppLevelVariables.IS_INFO_ICON_CLICKED === false) {
        AppLevelVariables.IS_INFO_ICON_CLICKED = true;
        this.props.dispatch(NavigateToStudentDetailsPage(student_id));
      }
      break;
    case "HOME_SICK":
      this.showHomSickDialog(true, student_id, student_Name)
      break;
    case "UNDO":
      this.showUndoSickDialog(true, student_id, student_Name)
      break;
    case "SCHOOL_ACTIVITY":
      this.showSchoolActivityDialog(true, student_id, student_Name)
      break;
    case "EMAIL1":
      // this.showHomSickDialog(true, student_id, student_Name)
      break;
    case "ALERT":
      this.showAlertInfoDialog(student_id, student_Name, leaveFrom, leaveUpto, leaveType)
      break;  
    default:
      break;
  }
}

deleteStudent = async () => {
  // this.handleDialogVisiblity(!this.state.alert_visibility)
  this.setState({alert_visibility: false});
  const sessionID = this.props.startSessionFromMobileProps.sessionID  
  try {
        if (sessionID) {
          const WSURL = await AsyncStorage.getItem(SERVICE_URL_KEY);
          console.log('session deleteStudent WSURL sessionID:', WSURL+sessionID+this.state.studentIDToBeOperated)
          NetInfo.isConnected.fetch().then((isConnected) => {
              console.log('Network connections is: ' + (isConnected ? 'online' : 'offline'));
              isConnected ?
              this.props.dispatch(SessionAction.removeStudenFromSession( WSURL, sessionID, this.state.studentIDToBeOperated))
              :
              // this.showSnackbar(I18n.t('internet_conn'))
              this.toolbar.showTopToDownAlert("error", "Network Issue", I18n.t('internet_conn'))
          })
        } else {
          this.showSnackbar("Error in deleting")
        }
        
  } catch (err) {
    console.log('session error in retrieving WSURL')
    
  }
}

sendAbsenceSickSMS = async () => {

  this.setState({alert_visibility: false});
  const sessionID = this.props.startSessionFromMobileProps.sessionID 
  try {
            //--params - WSURL, studentID, parentId, type, fromDateTime, uptoDateTime, reason, createdBy, createdDataTime, createdIp, schoolID
        var activeUserData = await AsyncStorage.getItem(ACTIVE_USER_DATA);
        if (activeUserData) {
        //= 0-username, 1-password, 2-userId, 3-schoolId, 4-sysId, 5-role, 6-lateTime, 7-sessionDelay, 8-countDownTime, 9- autoStartFlag
        var separatedData = activeUserData.split("|");  
        const currentDateAndTime = moment().tz('Europe/Berlin').format('YYYY-MM-DD HH:mm:ss')
        
        const WSURL = await AsyncStorage.getItem(SERVICE_URL_KEY);
        console.log('session sendAbsenceSickSMS WSURL sessionID:', WSURL+sessionID+this.state.studentIDToBeOperated)
        NetInfo.isConnected.fetch().then((isConnected) => {
            console.log('Network connections is: ' + (isConnected ? 'online' : 'offline'));
            isConnected ?
            this.props.dispatch(SessionAction.insertStudentAbsence( WSURL, this.state.studentIDToBeOperated, null, "1", currentDateAndTime, 
                        null, null, separatedData[2], currentDateAndTime, "192.12.10", separatedData[3]))
            :
            // this.showSnackbar(I18n.t('internet_conn'))
            this.toolbar.showTopToDownAlert("error", "Network Issue", I18n.t('internet_conn'))
        })
      }
  } catch (err) {
    console.log('session error in retrieving WSURL')
    
  }
}

reportSchoolActivity = async () => {

  this.setState({alert_visibility: false});
  const sessionID = this.props.startSessionFromMobileProps.sessionID 
  try {
            //--params - WSURL, studentID, parentId, type, fromDateTime, uptoDateTime, reason, createdBy, createdDataTime, createdIp
        var activeUserData = await AsyncStorage.getItem(ACTIVE_USER_DATA);
        if (activeUserData) {
        //= 0-username, 1-password, 2-userId, 3-schoolId, 4-sysId, 5-role, 6-lateTime, 7-sessionDelay, 8-countDownTime, 9- autoStartFlag
        var separatedData = activeUserData.split("|");  
        const currentDateAndTime = moment().tz('Europe/Berlin').format('YYYY-MM-DD HH:mm:ss')
        
        const WSURL = await AsyncStorage.getItem(SERVICE_URL_KEY);
        console.log('session sendAbsenceSickSMS WSURL sessionID:', WSURL+sessionID+this.state.studentIDToBeOperated)
        NetInfo.isConnected.fetch().then((isConnected) => {
            console.log('Network connections is: ' + (isConnected ? 'online' : 'offline'));
            isConnected ?
            this.props.dispatch(SessionAction.insertStudentAbsence( WSURL, this.state.studentIDToBeOperated, null, "17", currentDateAndTime, 
                        null, "School Activity", separatedData[2], currentDateAndTime, "192.12.10", separatedData[3]))
            // this.props.dispatch(SessionAction.insertStudentSchoolActivity(WSURL, this.state.studentIDToBeOperated, currentDateAndTime, separatedData[3], separatedData[2], 
            //   currentDateAndTime, "192.12.10"))
            :
            this.toolbar.showTopToDownAlert("error", "Network Issue", I18n.t('internet_conn'))
        })
      }
  } catch (err) {
    console.log('session error in retrieving WSURL')
  }
}

regretCheckIn = async () => {
  this.setState({alert_visibility: false});
  const sessionID = this.props.startSessionFromMobileProps.sessionID 
  try {
            //--params - WSURL, sessionID, studentID
        if (sessionID) {
          const WSURL = await AsyncStorage.getItem(SERVICE_URL_KEY);
          console.log('session regretCheckIn WSURL sessionID:', WSURL+sessionID+this.state.studentIDToBeOperated)
          NetInfo.isConnected.fetch().then((isConnected) => {
              console.log('Network connections is: ' + (isConnected ? 'online' : 'offline'));
              isConnected ?
              this.props.dispatch(SessionAction.regretCheckIN( WSURL, sessionID, this.state.studentIDToBeOperated))
              :
              // this.showSnackbar(I18n.t('internet_conn'))
              this.toolbar.showTopToDownAlert("error", "Network Issue", I18n.t('internet_conn'))
          })
        } else {
          this.showSnackbar("Error in regret check in!")
        }
        
  } catch (err) {
    console.log('session error in retrieving WSURL')
    
  }
}

showAlertInfoDialog = (studentAlertInfoId, studentAlertInfoName, leaveFrom, leaveUpto, leaveType) => {
  console.log('Session showAlertInfoDialog studentAlertInfoId:', studentAlertInfoId)
  this.setState({
    studentIDToBeOperated: studentAlertInfoId,
    absenceMessage: studentAlertInfoName + " was on leave and Punched In." ,
    absenceFromValue: leaveFrom,
    absenceUptoValue: leaveUpto,
    absenceTypeValue: leaveType,
  })
  this.AlertInfoModal.showModal();
}

onAlertInfoDonePress = () => {
  this.AlertInfoModal.hideModal()
  this.regretCheckIn();
}

onIconLoadError = (error) => {
  this.setState({imageURL : images.iconNoUser})
}

onEachViewSelected = item => {
  const { listOfSelectedStudents } = this.state;
  console.log('listOfSelectedStudents onEachViewSelected item:', item);

  //--using props value
  if (!listOfSelectedStudents.includes(item)) {
      this.setState({ listOfSelectedStudents: [...listOfSelectedStudents, item] });
    } else {
      this.setState({ listOfSelectedStudents: listOfSelectedStudents.filter(a => a !== item) });
    }
};

_selectAllStudents = () => () => {
  const { isAllStudentsSelected, listOfSelectedStudents, studentListDialogSubmitButtonTitle } = this.state;
  this.setState({isAllStudentsSelected: !this.state.isAllStudentsSelected});

  if(!this.state.isAllStudentsSelected) {
    const tempStudentList = [];
    for(let i=0; i < this.props.getAllStudentsProps.getAllStudentsSuccessReponse.length; i += 1) {
      if(!listOfSelectedStudents.includes(this.props.getAllStudentsProps.getAllStudentsSuccessReponse[i].nameValuePairs.student_name)) {
        tempStudentList.push(this.props.getAllStudentsProps.getAllStudentsSuccessReponse[i].nameValuePairs.student_name)
      } else {
        tempStudentList.pop(this.props.getAllStudentsProps.getAllStudentsSuccessReponse[i].nameValuePairs.student_name)
      }
    }
    this.setState({
      listOfSelectedStudents: tempStudentList,
      studentListDialogSubmitButtonTitle: tempStudentList.toString()
    });
  } else {
    this.setState({
      listOfSelectedStudents: [],
      studentListDialogSubmitButtonTitle: ''
    });
  }
}

_keyExtractor = (item, index) => item.id;


  render() {
      console.log('session render this.props:', this.props)
      const {subjectOfTeacherProps, getAllStudentsProps} = this.props;
      // console.log('session tthis.state.isLoading:', this.state.isLoading)
      return (
        <View style = { [styles.container] } >
                <StatusBar
                    hidden={true}
                />
                <BubbleStyleLoader
                    size={4} 
                    color="green"
                    spaceBetween={4}
                    loading={this.props.showLoaderStatusSession}
                    // loading={false}
                />
                <CustomDialog.DefaultDialog
                    alertVisibility={this.state.alert_visibility}
                    dialogTitle={this.state.alertTitle}
                    dialogBody={this.state.alertBody}
                    showInputField={false}
                    submitButtonText={this.state.submitButtonText}
                    onCloseButtonPress={this.handleDialogVisiblity(!this.state.alert_visibility)}
                    onSubmitButtonPress={this.handleOnSubmitPress()}
                    onBackButtonPress={this.handleDialogVisiblity(!this.state.alert_visibility)}
                />
                <ActionSheet
                  ref={o => { this.ActionSheet = o }}
                  title={title}
                  // message={message}
                  options={subjectOfTeacherProps.subjectOfTeacherSuccessResponse ?  subjectOfTeacherProps.subjectOfTeacherSuccessResponse : noData }
                  cancelButtonIndex={CANCEL_INDEX}
                  cancelButtonText='Cancel'
                  destructiveButtonIndex={this.state.DESTRUCTIVE_INDEX}
                  onPress={(buttonIndex) => this.handleActionSheetPress(buttonIndex)}
                  styles={{messageBox: { height: 60 }}}
                />
                <AddSubjectModal.DefaultDialog
                    ref={r => { this.AddSubjectModal = r }}
                    dialogTitle={I18n.t('LANGUAGE_CONSTANTS.add_subject')}
                    dialogInputFieldValueSubjectName = {this.state.dialogInputFieldValueSubjectName}
                    onChangeInputValueSubjectName={dialogInputFieldValueSubjectName => this.setState({dialogInputFieldValueSubjectName})}
                    dialogInputFieldValueSubjectCode = {this.state.dialogInputFieldValueSubjectCode}
                    onChangeInputValueSubjectCode={dialogInputFieldValueSubjectCode => this.setState({dialogInputFieldValueSubjectCode})}
                    submitButtonText={I18n.t('LANGUAGE_CONSTANTS.start_sess')}
                    selectedStudentsValue={this.state.studentListDialogSubmitButtonTitle}
                    selectStudentButtonTitle={I18n.t('LANGUAGE_CONSTANTS.select_students')}
                    selectStudentPressed={this.showStudentListDialog(true)}
                    // onCloseButtonPress={() => { this.handleSubjectDialog(!this.state.add_subject_alert_visibility)}}
                    onButtonPress={this.addSubjectAndStartSession()}
                    // onBackButtonPress={() => { this.handleSubjectDialog(!this.state.add_subject_alert_visibility)} }
                />
                <StudentListModal.DefaultDialog
                    ref={o => { this.StudentModal = o }}
                    dialogTitle='Select Students'
                    dataArray={getAllStudentsProps.getAllStudentsSuccessReponse ? getAllStudentsProps.getAllStudentsSuccessReponse : noData}
                    submitButtonText='Done'
                    listOfSelectedStudents={this.state.listOfSelectedStudents}
                    isAllStudentsSelected={this.state.isAllStudentsSelected}
                    onEachViewSelected={(item) => this.onEachViewSelected(item)}
                    onSelectAll={this._selectAllStudents()}
                    isForStudent={true}
                    // onCloseButtonPress={() => { this.handleStudentListDialog(!this.state.student_list_alert_visibility)}}
                    onButtonPress={this.onStudentListDialogDonePress()}
                />
                <AlertInfoModal.DefaultDialog
                    ref={r => { this.AlertInfoModal = r }}
                    dialogTitle='Warning'
                    absenceMessage = {this.state.absenceMessage}
                    absenceFromValue={this.state.absenceFromValue}
                    absenceUptoValue = {this.state.absenceUptoValue}
                    absenceTypeValue={this.state.absenceTypeValue}
                    submitButtonText='Undo CheckIn'
                    selectedStudentsValue={this.state.studentListDialogSubmitButtonTitle}
                    onButtonPress={this.onAlertInfoDonePress}
                />
                <ScannerModal.DefaultDialog
                    ref={o => { this.ScannerModal = o }}
                    haskKeysArray={this.props.startSessionFromMobileProps.cardKeysList}
                    onBarCodeScanned={(scannedKeyValue) => this._markStudentAttendance(scannedKeyValue, true)}
                />
            <View style = { [styles.topHalfContainer, {marginTop:Toolbar.TOOLBAR_HEIGHT}] }>
                <View style = { [styles.sessionAndScanView, {marginTop:0,justifyContent:'center',alignItems:'center'}] }>

                    <TouchableHighlight 
                      style={{ backgroundColor: this.state.disableSelectSubjectButtonState ? 'rgb(96, 125, 139)' : "rgba(92, 99,216, 1)",
                          borderColor: "transparent", borderWidth: 0, borderRadius: 20, height:40, width:200, justifyContent: 'center', 
                          paddingLeft: 10, paddingRight:10}}
                      onPress={this.showActionSheet()}
                      disabled={this.state.disableSelectSubjectButtonState}
                      // underlayColor={Colors.switchOnTint}
                      >
                      <View style = { {flexDirection:'row',justifyContent:'space-between'} } >

                        <View style = { {flex:0.9, justifyContent: 'center', alignItems: 'center'} }  >
                            <MarqueeText
                              style={{ fontWeight: "700",color:"#FFF", justifyContent: 'center', alignSelf: 'center' }}
                              duration={3000}
                              marqueeOnStart
                              loop
                              marqueeDelay={500}
                              marqueeResetDelay={500}
                            >
                             {this.state.selectedSheetItem}
                            </MarqueeText>
                        </View>

                        <View style = { {flex:0.1, marginLeft:0, justifyContent: 'center'} } >
                            <Icon  name='angle-down'
                              style = { {justifyContent: 'center', alignSelf: 'center'}}
                              size={24}
                              color='white'
                            />
                        </View>
                      </View>
                    </TouchableHighlight>
                    <Button
                        text={ !this.state.sessionStartStatus ? I18n.t('LANGUAGE_CONSTANTS.start_sess') :I18n.t('LANGUAGE_CONSTANTS.end_sess') }
                        loading={false}
                        textStyle={{ fontWeight: "700" }}
                        buttonStyle={{
                          backgroundColor: this.state.disableSessionButtonState ? 'rgb(96, 125, 139)' : "rgba(92, 99,216, 1)",
                          width: 200,
                          height: 40,
                          borderColor: "transparent",
                          borderWidth: 0,
                          borderRadius: 20
                        }}
                        containerStyle={{  margin: 5 }}
                        disabled={this.state.disableSessionButtonState}
                        onPress={this._updateStartEndSession(false)}
                    />
                {/* </View> */}
                </View>
            </View>
            {/*
            --bottom container for list items
            */}
            <View style={[styles.bottomContainer]}>
            {
              //  !this.state.sessionStartStatus ?
               !this.props.startSessionFromMobileProps.successResponse 
               ?
               <View style={[{flex:1, flexDirection:'column',alignItems:'center', justifyContent:'flex-start'}]}>
                  <View style={{width:"50%", flexDirection:'row', justifyContent:'center', alignItems:'center', marginLeft:100, marginRight:100, marginTop:25}}>
                    <Text style={{flex:1, fontWeight: "200", fontSize: 16, color: 'black'}}>{I18n.t('LANGUAGE_CONSTANTS.start_time')}</Text>
                    <CSDateAndTimePicker
                      style={{width: 100}}
                      date={this.state.startTime >= moment().format('HH:mm') ? this.state.startTime : this._updateErrorTime("start") }
                      mode="time"
                      format="HH:mm"
                      placeholder="Start Time"
                      confirmBtnText="Confirm"
                      cancelBtnText="Cancel"
                      showIcon={true}
                      hideText={false}
                      minuteInterval={1}
                      onDateChange={(startTime) => {this.setState({startTime: startTime});}}
                    />
                  </View>  
                  <View style={{width:"50%", flexDirection:'row', justifyContent:'center', alignItems:'center', marginLeft:100, marginRight:100, marginTop:10, marginBottom:5}}>
                    <Text style={{flex:1, fontWeight: "200", fontSize: 16, color: 'black'}}>{I18n.t('LANGUAGE_CONSTANTS.end_time')}</Text>
                    <CSDateAndTimePicker
                      style={{width: 100}}
                      date={this.state.endTime > moment().format('HH:mm') ? this.state.endTime : this._updateErrorTime("end") }
                      mode="time"
                      format="HH:mm"
                      placeholder="End Time"
                      confirmBtnText="Confirm"
                      cancelBtnText="Cancel"
                      showIcon={true}
                      hideText={false}
                      minuteInterval={1}
                      onDateChange={(endTime) => {this.setState({endTime: endTime});}}
                    />
                  </View>
                  <Button
                        text={I18n.t('LANGUAGE_CONSTANTS.schedule_a_session')}
                        loading={false}
                        textStyle={{ fontWeight: "700" }}
                        buttonStyle={{
                          backgroundColor: "rgba(92, 99,216, 1)",
                          width: 200,
                          height: 40,
                          borderColor: "transparent",
                          borderWidth: 0,
                          borderRadius: 20
                        }}
                        containerStyle={{justifyContent:'center', alignItems:'center', margin:4}}
                        onPress={this.scheduleSession()}
                        disabled={this.state.disableScheduleButton}
                    />
                </View>
                
            :
            <ScrollView style={{flex: 1}}>
                <FlatList
                  horizontal
                  // data={_.values(this.props.startSessionFromMobileProps.sessionDataArray)}
                  data={this.props.startSessionFromMobileProps.sessionDataArray}
                  extraData={this.props.startSessionFromMobileProps.sessionDataArray}
                  renderItem={({ item, index }) => this.renderEachStudentView(item, index)}
                  keyExtractor={this._keyExtractor}
                  initialNumToRender={2}
                  // ItemSeparatorComponent={this.renderSeparator}
                  // ListHeaderComponent={this.renderHeader}
                  // ListFooterComponent={this.renderFooter}
                  // onRefresh={this.handleRefresh}
                  // refreshing={this.state.refreshing}
                  // onEndReached={this.handleLoadMore}
                  // onEndReachedThreshold={50}
                />
              {/* </List> */}
            </ScrollView>
            }
            {/* </View> */}
            </View>
            <CustomSnackbar
                    ref="custom_snackbar"
                    snackBarBackColor= 'black'
                    snackBarTextColor= 'white'
                    imageColor='green'
                />
            <Toolbar.White
                    ref={ref => this.toolbar = ref}
                    RightIcon={<View>
                        <Image
                          style={{
                              width: 25,
                              height: 25,
                              }}
                          // style={[styles.iconStyles, transform= [{rotate: RotateData}] ]}
                          source={images.iconQRScan}
                        />
                        </View>}
                    onRightIconPress={this.handleScannedClick()}
                    LeftIcon={<View/>}
                    toolbarTitle={I18n.t('LANGUAGE_CONSTANTS.session_and_subject')}
                    elevation={8}
                />
        </View>
        );
    }

    
}

const mapStateToProps = (state) => {
  const showLoaderStatusSession = state.generalReducer.get('loaderStatusSession');
  const startSchduledSessionBySubjectID = state.generalReducer.get('startSchduledSessionBySubjectID');
  //--props for getting scanned value
  const scannedQRcodeValueProps = state.homeReducer.get('scannedQRcode');

  const subjectOfTeacherStatus = state.homeReducer.get('getSubjectOfTeacherStatus');
  const subjectOfTeacherProps = {
      subjectOfTeacherSuccessResponse: subjectOfTeacherStatus ? subjectOfTeacherStatus.response : undefined,
      subjectJsonData: subjectOfTeacherStatus ? subjectOfTeacherStatus.subjectListJsonResponse : undefined,
      subjectOfTeacherErrorResponse: subjectOfTeacherStatus ? subjectOfTeacherStatus.errorResponse : undefined,
      isError: subjectOfTeacherStatus ? subjectOfTeacherStatus.error : undefined,
    }
  const studentListStatus = state.homeReducer.get('getAllStudentsStatus');
  const getAllStudentsProps = {
    getAllStudentsSuccessReponse: studentListStatus ? studentListStatus.response : undefined,
    getAllStudentsErrorReponse: studentListStatus ? studentListStatus.errorResponse : undefined,
    isError: studentListStatus ? studentListStatus.error : undefined,
  }

  const startSessionFromMobileStatus = state.homeReducer.get('StartSessionFromMobile');
  const startSessionFromMobileProps = {
      successResponse: startSessionFromMobileStatus ? startSessionFromMobileStatus.response : undefined,
      sessionDataArray: startSessionFromMobileStatus ? startSessionFromMobileStatus.sessionDataArray : undefined,
      sessionID: startSessionFromMobileStatus ? startSessionFromMobileStatus.session_ID : undefined,
      cardKeysList: startSessionFromMobileStatus ? startSessionFromMobileStatus.cardKeysList : undefined,
      isPollAgain: startSessionFromMobileStatus ? startSessionFromMobileStatus.isPollAgain : true,
      sendAbsencSMSParsedData: startSessionFromMobileStatus ? startSessionFromMobileStatus.sendAbsencSMSParsedData : undefined,
      pollCommonParsedData: startSessionFromMobileStatus ? startSessionFromMobileStatus.pollCommonParsedData : undefined,
      errorResponse: startSessionFromMobileStatus ? startSessionFromMobileStatus.errorResponse : undefined,
  }

  const checkAnySessionForTeacherStatus = state.homeReducer.get('CheckIfAnySessionForTeacher');
  const checkAnySessionForTeacherProps = {
      successResponse: checkAnySessionForTeacherStatus ? checkAnySessionForTeacherStatus.response : undefined,
      errorResponse: checkAnySessionForTeacherStatus ? checkAnySessionForTeacherStatus.errorResponse : undefined,
  }

  const scheduleSessionStatus = state.homeReducer.get('scheduleSessionForTeacher');
  const scheduleSessionProps = {
    schedule_session_id: scheduleSessionStatus ? scheduleSessionStatus.response : undefined,
    schedule_session_error: scheduleSessionStatus ? scheduleSessionStatus.errorResponse : undefined,
  }
  
  const endSessionStatus = state.homeReducer.get('endSessionFromMobile');
  const endSessionFromMobileProps = {
      successResponse: endSessionStatus ? endSessionStatus.response : undefined,
      errorResponse: endSessionStatus ? endSessionStatus.errorResponse : undefined,
  }

  const makeStudentAttendanceStatus = state.homeReducer.get('makeStudentAttendanceFromMobile');
  const makeStudentAttendanceFromMobileProps = {
      successResponse: makeStudentAttendanceStatus ? makeStudentAttendanceStatus.response : undefined,
      errorResponse: makeStudentAttendanceStatus ? makeStudentAttendanceStatus.errorResponse : undefined,
  }
  
  const removeStudenFromSessionStatus = state.homeReducer.get('removeStudenFromSession');
  const removeStudenFromSessionStatusProps = {
      successResponse: removeStudenFromSessionStatus ? removeStudenFromSessionStatus.response : undefined,
      errorResponse: removeStudenFromSessionStatus ? removeStudenFromSessionStatus.errorResponse : undefined,
  }

  const insertStudentAbsenceStatus = state.homeReducer.get('insertStudentAbsence');
  const insertStudentAbsenceProps = {
      successResponse: insertStudentAbsenceStatus ? insertStudentAbsenceStatus.response : undefined,
      errorResponse: insertStudentAbsenceStatus ? insertStudentAbsenceStatus.errorResponse : undefined,
  }

  const sendAbsenceSMSStatus = state.homeReducer.get('sendAbsenceSMS');
  const sendAbsenceSMSProps = {
      successResponse: sendAbsenceSMSStatus ? sendAbsenceSMSStatus.response : undefined,
      errorResponse: sendAbsenceSMSStatus ? sendAbsenceSMSStatus.errorResponse : undefined,
  }

  const regretCheckINStatus = state.homeReducer.get('regretCheckIN');
  const regretCheckINProps = {
      successResponse: regretCheckINStatus ? regretCheckINStatus.response : undefined,
      errorResponse: regretCheckINStatus ? regretCheckINStatus.errorResponse : undefined,
  }
  
  const addSubjectFromMobileStatus = state.homeReducer.get('addSubjectFromMobile');
  const addSubjectFromMobileProps = {
      successResponse: addSubjectFromMobileStatus ? addSubjectFromMobileStatus.response : undefined,
      errorResponse: addSubjectFromMobileStatus ? addSubjectFromMobileStatus.errorResponse : undefined,
  }

  const pollCommonStatus = state.homeReducer.get('pollCommonForMobile');
  const pollCommonProps = {
      successResponse: pollCommonStatus ? pollCommonStatus.successResponse : undefined,
      pollUpdateAttendanceData: pollCommonStatus ? pollCommonStatus.pollUpdateAttendanceData : undefined,
      pollUpdateAbsenceData: pollCommonStatus ? pollCommonStatus.pollUpdateAbsenceData : undefined,
      pollUpdateSMSData: pollCommonStatus ? pollCommonStatus.pollUpdateSMSData : undefined,
      pollUpdateDeleteFromWebData: pollCommonStatus ? pollCommonStatus.pollUpdateDeleteFromWebData : undefined,
      errorResponse: pollCommonStatus ? pollCommonStatus.errorResponse : undefined,
  }

  const getAllActiveSessionsStatus = state.homeReducer.get('getAllActiveSessions');
  const getAllActiveSessionsProps = {
      successResponse: getAllActiveSessionsStatus ? getAllActiveSessionsStatus.response : undefined,
      errorResponse: getAllActiveSessionsStatus ? getAllActiveSessionsStatus.errorResponse : undefined,
  }

  return {
    showLoaderStatusSession,
      startSchduledSessionBySubjectID,
      subjectOfTeacherProps,
      getAllStudentsProps,
      startSessionFromMobileProps,
      checkAnySessionForTeacherProps,
      scheduleSessionProps,
      endSessionFromMobileProps,
      makeStudentAttendanceFromMobileProps,
      removeStudenFromSessionStatusProps,
      insertStudentAbsenceProps,
      sendAbsenceSMSProps,
      regretCheckINProps,
      addSubjectFromMobileProps,
      scannedQRcodeValueProps,
      pollCommonProps,
      getAllActiveSessionsProps,
  };
}
export default connect(mapStateToProps)(Sessions);