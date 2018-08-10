import React, { Component } from 'react';
import { View, Text,ActivityIndicator, FlatList,
    StyleSheet, TouchableHighlight, Image,
    Platform, Dimensions } from 'react-native';
import { connect } from 'react-redux';

import { NavigateToDetailsPage } from '../../actions/navigation';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        alignItems: 'flex-start',
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

class HomeScreen extends Component {

    isAndroid = Platform.OS === 'android'

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            questionList: [],
            page: 1,
            error: null,
            refreshing: false,
            
          };
    }

    componentDidMount () {
        this.makeQuestionsRequest()
    }

    makeQuestionsRequest = () => {
        const { page } = this.state;
        const url = `https://api.stackexchange.com/2.2/questions?page=${page}&order=desc&sort=activity&site=stackoverflow`;
        this.setState({ loading: true });
        fetch(url)
          .then(res => res.json())
          .then(res => {
            console.log('response items:', res.items);
            this.setState({
            questionList: page === 1 ? res.items : [...this.state.questionList, ...res.items],
              error: res.error || null,
              loading: false,
              refreshing: false
            });
          })
          .catch(error => {
            this.setState({ error, loading: false });
          });
      };
    
    componentWillUnmount() {
    }

    renderEachStudentView = (item) => {
        console.log('render Each item:', item);

        return (
          
            <TouchableHighlight onPress={() => this.props.dispatch(NavigateToDetailsPage(item.question_id))}>
            <View style={{ flexDirection: 'column' }}>
            
                <View style={{flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center',padding:10}}>
     
                <Image
                    source={{uri: item.owner.profile_image}}
                    style={{height: 30, width: 30, borderRadius: 10}}
                />
            <View style={{ marginLeft: 10,  flexDirection: 'column', marginRight:5 }}>
            <Text style={{fontSize:14}} numberOfLines={1} ellipsizeMode={'tail'}>
                Title: {item.title}
                </Text>
                <Text style={{fontSize:14}} numberOfLines={1} ellipsizeMode={'tail'}>
                Name: {item.owner.display_name}
                </Text>
                <Text style={{fontSize:14}} numberOfLines={1} ellipsizeMode={'tail'}>
                score: {item.score}
                </Text>
                <View style={{ marginLeft: 5,  flexDirection: 'row', marginRight:5 }}>
                <Text style={{fontSize:14}} numberOfLines={1} ellipsizeMode={'tail'}>
                    Tags: 
                  </Text>
                {
                  item.tags.length > 0 ?
                  item.tags.map((rowData) => (
                  
                  <View style={{ marginLeft: 5,  flexDirection: 'row', marginRight:5 }}>
                    <Text style={{fontSize:14}} numberOfLines={1} ellipsizeMode={'tail'}>
                    {rowData},
                  </Text>
                    </View>
                  ))
                  : <Text style={{fontSize:14}} numberOfLines={1} ellipsizeMode={'tail'}>
                  No tags found: 
                </Text>
                }
                </View>
                <Text style={{fontSize:14}} numberOfLines={1} ellipsizeMode={'tail'}>
                Date:{new Date(item.last_activity_date).toString("YYYY-MM-dd")}
                </Text>
                </View>
                </View>
            </View>
            </TouchableHighlight>
        )
      }

      handleRefresh = () => {
        this.setState(
          {
            page: 1,
            refreshing: true
          },
          () => {
            this.makeQuestionsRequest()
          }
        );
      };
    
      handleLoadMore = () => {
        this.setState(
          {
            page: this.state.page + 1
          },
          () => {
            this.makeQuestionsRequest()
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
    
      renderHeader = () => {
        return <Text style={{fontSize:20}} numberOfLines={1} ellipsizeMode={'tail'}>List of Questions</Text>
        ;
      };
    
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

    render() { 

        return (
        <View style = { styles.container } >
           
           <FlatList
                  data={this.state.questionList}
                  renderItem={({ item }) => this.renderEachStudentView(item)}
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
        </View>
        );
    }
}

export default connect()(HomeScreen);