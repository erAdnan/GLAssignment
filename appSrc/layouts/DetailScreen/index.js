import React, { Component } from 'react';
import { View, Text,FlatList,
    StyleSheet, TouchableHighlight, Image,
    Platform, Dimensions } from 'react-native';
import { connect } from 'react-redux';

import { navigateBack } from '../../actions/navigation';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingRight:5,
        paddingLeft: 5
    },
    textField: {
        fontSize: 20,
        textAlign: 'center',
        margin: 10,
        
    },
});

class DetailScreen extends Component {

    isAndroid = Platform.OS === 'android'

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            answerData: [],
            page: 1,
            error: null,
            refreshing: false,
            
          };
    }

    componentDidMount () {
        const questionID = this.props.navigation.state.params.questionID.id
        this.makeAnsDetailRequest(questionID)
    }

    componentWillUnmount() {
    }

    makeAnsDetailRequest = (questionID) => {
        const { page } = this.state;
        const url = `https://api.stackexchange.com/2.2/questions/${questionID}/answers?page=1&order=desc&sort=activity&site=stackoverflow`;
        this.setState({ loading: true });
        fetch(url)
          .then(res => res.json())
          .then(res => {
            console.log('response answer items:', res);
            this.setState({
            answerData: page === 1 ? res.items : [...this.state.answerData, ...res.items],
              error: res.error || null,
              loading: false,
              refreshing: false
            });
          })
          .catch(error => {
            this.setState({ error, loading: false });
          });
      };

      renderEachOwnerView = (item) => {
        console.log('renderEachOwnerView:', item);
        return (
          
            <TouchableHighlight onPress={() => this.props.dispatch(navigateBack())}>
            <View style={{ flexDirection: 'column' }}>
                <View style={{flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center',padding:10}}>
     
                <Image
                    source={{uri: item.owner.profile_image}}
                    style={{height: 30, width: 30, borderRadius: 10}}
                />
            <View style={{ marginLeft: 10,  flexDirection: 'column' }}>
            
                <Text style={{fontSize:14}} numberOfLines={1} ellipsizeMode={'tail'}>
                Answer By: {item.owner.display_name}
                </Text>
                <Text style={{fontSize:14}} numberOfLines={1} ellipsizeMode={'tail'}>
                score: {item.score}
                </Text>
                <Text style={{fontSize:14}} numberOfLines={1} ellipsizeMode={'tail'}>
                Activity data: {new Date(item.last_activity_date).toString("YYYY-MM-dd")}
                </Text>
                </View>
                </View>
            </View>
            </TouchableHighlight>
        )
      }

      renderHeader = () => {
        return <Text style={{fontSize:20}} numberOfLines={1} ellipsizeMode={'tail'}>List of Answers</Text>
        ;
      };

    render() { 

        return (
        <View style = { styles.container } >
           <View style={{ marginLeft: 10,  flexDirection: 'column' }}>
           <TouchableHighlight onPress={() => this.props.dispatch(navigateBack())}>
                <Text style={{fontSize:20}}> Go Back</Text>
                </TouchableHighlight>
                <View style={{flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center',padding:10}}>
                
                {
                  this.state.answerData.length > 0 ? 
                  <FlatList
                  data={this.state.answerData}
                  renderItem={({ item }) => this.renderEachOwnerView(item)}
                  keyExtractor={item => item.id}
                  initialNumToRender={2}
                  ItemSeparatorComponent={this.renderSeparator}
                  ListHeaderComponent={this.renderHeader}
                  ListFooterComponent={this.renderFooter}
                  onRefresh={this.handleRefresh}
                  refreshing={this.state.refreshing}
                  onEndReached={this.handleLoadMore}
                  onEndReachedThreshold={50}
                />
                :
                <Text style={{fontSize:14}} numberOfLines={1} ellipsizeMode={'tail'}>
                No answers found for this question
                </Text>
                }
                
            {/* <View style={{ marginLeft: 10,  flexDirection: 'column' }}>
                <Text style={{fontSize:14}} numberOfLines={1} ellipsizeMode={'tail'}>
                Name: {this.state.answerData.items.owner.display_name}
                </Text>
                <Text style={{fontSize:14}} numberOfLines={1} ellipsizeMode={'tail'}>
                score: {this.state.answerData.score}
                </Text>
                <Text style={{fontSize:14}} numberOfLines={1} ellipsizeMode={'tail'}>
                {this.state.answerData.last_activity_date}
                </Text>
                </View> */}
                </View>
            </View>
        </View>
        );
    }
}

export default connect()(DetailScreen);