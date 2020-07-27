import React, { Component } from 'react';
import CKEditor from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import parse from 'html-react-parser';

import './App.css';

class App extends Component {
  state = {
    data: '',
    showEditor: false
  };

  ediorDisplayHanlder = () => {
    this.setState({
      showEditor: !this.state.showEditor
    });
  };

  saveDataHandler = () => {
    console.log(this.state.data);
    alert("Data Saved", this.state.data);
  }

  changeHandler = (event, editor) => {
    console.log( { event, editor } );
    console.log(editor.getData());
    this.setState({
      data: editor.getData()
    })
  };

  chekDirtyHandler = () => {
    const editor = ClassicEditor.instances.editor1;
    alert(editor.checkDirty());
  };

  render() {
    let editor = null;
    if (this.state.showEditor) {
      editor = <div>
          <CKEditor
            type="inline"
            data={this.state.data}
            editor={ClassicEditor}
            onChange={(event, editor) => {this.changeHandler(event, editor)}}
          />
        </div>;
    }

    return (
      <div className="App">
        <button onClick={this.ediorDisplayHanlder}>{this.state.showEditor ? "Close Editor" : "Show Editor"}</button>
        {editor}
        <br/>
        <div>
          <h3>Raw Data</h3>
          {this.state.data}
          <h3>Parsed Date</h3>
          {parse(this.state.data)}
        </div>
        <button onClick={this.saveDataHandler}>Save</button>
        <button onClick={this.chekDirtyHandler}>Is Dirty.?</button>
      </div>
    );
  };
}

export default App;
