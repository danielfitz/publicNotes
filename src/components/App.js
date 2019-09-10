import React, { Component } from 'react';
import firebase from "../firebase.js";
import Editor from "./Editor.js";
import NotesList from "./NotesList.js";
import BlogPost from "./BlogPost.js";
import PublicList from "./PublicList.js";

import {
  BrowserRouter as Router,
  Route
} from "react-router-dom";

import '../styles/App.scss';
import { Fullscreen, FullscreenExit } from "@material-ui/icons";
import { Button } from "@material-ui/core";

const provider = new firebase.auth.GoogleAuthProvider();
const auth = firebase.auth();

class App extends Component {
  constructor() {
    super();
    this.state = {
      user: null,
      currentNoteId: null,
      notes: [],
      fullScreen: false
    }
  }

  componentDidMount() {
    // Auth state conditional logic
    auth.onAuthStateChanged(async (user) => {
      // IF there is a logged in authorized user,
      // THEN sync to that user's node in Firebase
      if (user) {
        user.node = "users"; // adding node key to user

        this.syncNotes(user);

        this.setState({
          user
        });
      // OTHERWISE the user is anonymous,
      // SO create a new anonymous user node in Firebase
      } else {
        const anonymousUser = await firebase.database().ref("anonymous").push("");
        anonymousUser.node = "anonymous"; // adding node key to anonymous user
        anonymousUser.uid = anonymousUser.key;

        this.syncNotes(anonymousUser);

        this.setState({
          user: anonymousUser
        });
      };
    });

    // EVENT LISTENER:
    // If user is anonymous, delete their unique record when they leave the site or refresh
    window.addEventListener('beforeunload', (event) => {
      if (this.state.user && this.state.user.node === "anonymous") {
        const anonymousNode = `${this.state.user.node}/${this.state.user.uid}`;
        const anonymousRef = firebase.database().ref(anonymousNode);
        anonymousRef.remove();
      };

      //beforeunload needs to return something, so delete the return to work in chrome
      delete event['returnValue'];
    });
  };

  // Method to sync notes to given user node in Firebase
  syncNotes = (newUser) => {
    // Turn off previous Firebase event listener IF there was one before
    if (this.state.user) {
      const oldNode = `${this.state.user.node}/${this.state.user.uid}`;
      firebase.database().ref(oldNode).off("value");
    };

    // Start new Firebase event listener to constantly grab notes in database
    const newNode = `${newUser.node}/${newUser.uid}`;
    const userRef = firebase.database().ref(newNode);
    
    userRef.on("value", (response) => {
      const data = response.val();
  
      const notesArray = [];
  
      for (let key in data) {
        notesArray.push({
          id: key,
          title: data[key].title,
          text: data[key].text,
          published: data[key].published,
          createdTimestamp: data[key].createdTimestamp
        });
      };
  
      // Sort notes by newest created note first
      notesArray.sort((a, b) => a.createdTimestamp < b.createdTimestamp);
      
      this.setState({
        notes: notesArray
      });
    });
  };

  // Method that stores a selected note in state to be used when deleting or editing a note
  // NOTE: Gets passed to child components
  selectNote = (noteId) => {
    this.setState({
      currentNoteId: noteId
    });
  };

  // Method that toggles full screen state (and re-renders how page is displayed)
  toggleFullScreen = () => {
    this.setState({
      fullScreen: !this.state.fullScreen
    });
  };

  // Method for logging in
  // NOTE: This deletes the anonymous user that gets created automatically
  login = () => {
    auth.signInWithPopup(provider)
      .then((result) => {
        const anonymousNode = `${this.state.user.node}/${this.state.user.uid}`;
        const anonymousRef = firebase.database().ref(anonymousNode);
        anonymousRef.remove();

        const user = result.user;
        user.node = "users"; // Adding node key to user
        this.setState({
          user
        });
      });
  };

  // Method for logging out
  logout = () => {
    auth.signOut()
      .then(() => {
        this.setState({
          user: null
        });
      });
  };

  // Method for conditionally rendering login and logout on page
  renderAuth = () => {
    if (this.state.user && this.state.user.node !== "anonymous") {
      return (
        <div className="authContainer">
          <Button
            className="logout"
            variant="outlined"
            size="small"
            onClick={this.logout}
          >
            Log Out
          </Button>
          <p className="authStatus">Hi, {this.state.user.displayName}!</p>
        </div>
      );
    } else {
        return (
          <div className="authContainer">
            <Button
              className="login"
              variant="outlined"
              size="small"
              onClick={this.login}
            >
              Log In
            </Button>
            <p className="authStatus">Anonymous user. All notes created here are deleted when you leave. Log in to start saving notes.</p>
          </div>
        );
    };
  };

  render() {
    return (
      <Router>
        <div className="app">
          <header className={this.state.fullScreen ? "collapsed" : ""}>
            <div className="headerWrapper wrapper">
              <h1>Public Notes</h1>

              {this.renderAuth()}

              <Route exact path="/" render={ () => {
                if (this.state.user) {
                  return (
                    <NotesList
                    currentNoteId={this.state.currentNoteId}
                    selectNote={this.selectNote}
                    notes={this.state.notes}
                    user={this.state.user}
                    />
                  );
                } else {
                  return <p>Loading...</p>;
                };
              }} />

              <Route path="/:node/:uid" render={ (params) => {
                return (
                  <PublicList
                    {...params}
                  />
                );
              }} />
            </div>
          </header>

          <main className={this.state.fullScreen ? "fullScreen" : ""}>
            <div className="wrapper">
              <Route exact path="/" render={ () => {
                if (this.state.user) {
                  return (
                    <Editor
                      currentNoteId={this.state.currentNoteId}
                      selectNote={this.selectNote}
                      user={this.state.user}
                    />
                  );
                } else {
                  return <p>Loading...</p>;
                };
              }} />

              <Route path="/:node/:uid" render={ (params) => {
                const userUrl = `${window.location.origin}/${params.match.params.node}/${params.match.params.uid}`;
                return (
                  <section className="publicFeedIntro">
                    <h2>Public Feed of User: <a className="feedLink" href={userUrl}>{params.match.params.uid}</a></h2>
                    <p>To view a note, select any of this user's notes in the sidebar!</p>
                  </section>
                );
              }} />

              <Route exact path="/:node/:uid/:noteId" render={params => <BlogPost {...params} />} />
            </div>
          </main>

          {this.state.fullScreen ?
            <FullscreenExit className="fullScreenToggle" onClick={this.toggleFullScreen} aria-label="Exit full screen and display header" /> :
            <Fullscreen className="fullScreenToggle" onClick={this.toggleFullScreen} aria-label="Enter full screen and hide header" />
          }
        </div>
      </Router>
    );
  };
};

export default App;
