import React, { Component } from "react";
import firebase from "../firebase.js";
import { AddCircleOutlined, Backspace } from "@material-ui/icons";

class NotesControls extends Component {
  constructor(props) {
    super(props);
  };

  addNewNote = () => {
    const dbRef = firebase.database().ref();

    dbRef.push({
      title: "",
      text: "",
      createdTimestamp: Date.now()
    }).then(newNote => {
      this.props.selectNote(newNote.key);
    });
  };

  deleteNote = (noteId) => {
    if (window.confirm("This will delete your note permanently.")) {
      this.props.selectNote(null);
      
      const noteRef = firebase.database().ref(noteId);
      noteRef.remove();
    };
  };

  convertToDate = (timestamp) => {
    const date = new Date(timestamp);
    return `Created: ${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}, ${date.getHours()}:${date.getMinutes()}`;
  };
  
  render() {
    return (
      <div className="notesControls">
        <AddCircleOutlined onClick={this.addNewNote} className="addNote" />
        <section className="notesList">
          <h2>List of Notes</h2>
          <ul>
            {this.props.notes.map(note => {
              return (
                <li key={note.id}>
                  <article
                    className={`note ${this.props.currentNoteId === note.id ? "selected" : ""}`}
                    onClick={() => this.props.selectNote(note.id)}
                  >
                    <Backspace
                      className="deleteNote"
                      onClick={(event) => {
                        event.stopPropagation();
                        this.deleteNote(note.id);
                      }} 
                    />
                    <h3 className="noteTitle">
                      { note.title ? note.title : "New Note" }
                    </h3>
                    <p className="noteText">
                      { note.text ? note.text.substring(0, 10).trim() + (note.text.length > 10 ? "..." : "") : "Empty Note" }
                    </p>
                    <p className="noteCreateDate">{ this.convertToDate(note.createdTimestamp) }</p>
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    );
  }
};

export default NotesControls;