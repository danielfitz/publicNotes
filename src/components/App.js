import React, { Component } from 'react';
import firebase from "../firebase.js";
import Editor from "./Editor.js";
import NotesControls from "./NotesControls.js";
import '../styles/App.scss';

class App extends Component {
  constructor() {
    super();
    this.state = {
      currentNoteId: null,
      notes: []
    }
  }

  componentDidMount() {
    const dbRef = firebase.database().ref();

    dbRef.on("value", (response) => {
      const data = response.val();

      const notesArray = [];

      for (let key in data) {
        notesArray.push({
          id: key,
          title: data[key].title,
          body: data[key].body,
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

  selectNote = (noteId) => {
    // console.log("selectNote ran", noteId);
    this.setState({
      currentNoteId: noteId
    });
  };

  render() {
    return (
      <div className="app">
        <NotesControls
          currentNoteId={this.state.currentNoteId}
          selectNote={this.selectNote}
          notes={this.state.notes}
        />
        <Editor
          currentNoteId={this.state.currentNoteId}
          selectNote={this.selectNote}
        />
      </div>
    );
  };
};

export default App;
