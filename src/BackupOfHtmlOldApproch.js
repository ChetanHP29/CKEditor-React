import React, { Component } from 'react';
import CKEditor from 'ckeditor4-react';
import parse from 'html-react-parser';

import './App.css';

class App extends Component {
  state = {
    data: "\u003cdiv xmlns:dd=\"DynamicDocumentation\" class=\"ddgrouper ddremovable\" dd:btnfloatingstyle=\"top-right\" id=\"_77609141-8989-47c9-93b6-b048eeb5db42\"\u003e\n\u003cspan style=\"text-decoration: underline;\"\u003eOngoing\u003c/span\u003e\u003cdiv class=\"ddemrcontentitem\" style=\"margin-left: 1em; padding-left: 1em; text-indent: -1em;\" dd:entityid=\"\" dd:contenttype=\"PROBLEMS\" id=\"_f0265850-7afb-4227-bcf7-1183cd273e2e\"\u003eNo chronic problems\u003c/div\u003e\n\u003c/div\u003e\n\u003cdiv xmlns:dd=\"DynamicDocumentation\" class=\"ddgrouper ddremovable\" dd:btnfloatingstyle=\"top-right\" id=\"_b5db751f-7ab0-498f-be01-707c2eb7de2d\"\u003e\n\u003cspan style=\"text-decoration: underline;\"\u003eHistorical\u003c/span\u003e\u003cdiv style=\"margin-left: 1em; padding-left: 1em; text-indent: -1em;\"\u003eNo qualifying data\u003c/div\u003e\n\u003c/div\u003e\n",
    showEditor: false,
    isDirty: false
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

  changeHandler = (event) => {
    console.log( { event } );
    console.log(event.editor.getData());
    this.setState({
      data: event.editor.getData(),
      isDirty: event.editor.checkDirty()
    });

    this.compareHtml();
  };

  isStartOfTag = char => char === '<';

  isEndOdTag = char => char === '>';

  formatHtml = (htmlString) => htmlString
    .replace(/(\n|\r|\t|\v|\f)+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/&#xA0;/g, ' ')
    .replace(/↵/g, '')// this is equivaent to '<br />' but looks good, TBV
    .trim();

  extractNoteHtml = (noteHtmlString) => {
    let  mode = 'char';
    let current_word = '';
    const hmtlArray = [];
    for (let char of noteHtmlString) {
      //debugger;
      switch (mode) {
        case 'char':
            if (this.isStartOfTag(char)) {
              mode = 'tag';
              if (current_word) {
                hmtlArray.push(current_word);
              }
              current_word = '<';
            } else {
              current_word += char;
            }
            // if incase we are getting whitespace btween < & >, should be takencare
            break;
        case 'tag':
            if (this.isEndOdTag(char)) {
              current_word += '>';
              hmtlArray.push(current_word);
              current_word = '';
              mode = 'char';
            } else {
              current_word += char;
            }
            break;
            
            default: throw new Error("Mode not found");
      }
    }
    if (current_word) {
      hmtlArray.push(current_word);
    }
    return hmtlArray.filter(htmlElement => htmlElement !== " ");;
  };

  getEmrData = (note) => {
    let emrType = '';
    note.noteHtmlArray.forEach((ele, index) => {
      //Finding different EMR type
      if (ele.includes('class="ddemrcontent"')) {
        emrType = ele.split(' ').find(ele => {
          return ele.includes('dd:contenttype')});
        
        if (emrType.includes("DXORDERS")) {
          note.emrContentType.push("DXORDERS");
        } else if (emrType.includes("DXGOALS")) {
          note.emrContentType.push("DXGOALS");
        }  
      }

      //Finding Pronlems and free text
      if (ele.includes('class="ddemrcontentitem')) {
        debugger;
        note.emrItems.push({
          emrTypeIndex: index,
          emrType: note.noteHtmlArray[index+1].trim()
        });

        //note.data.set('')
      }

      if (ele.includes('class="ddfreetext ddremovable"')) {
        note.freeTexts.push({
          freeTextIndex: index,
          freeText: note.noteHtmlArray[index+1]
        });
      }

    });
  };

  isBothNotesAreEqual = (currentNote, futureNote) => {
    if (currentNote.emrContentType.length !== futureNote.emrContentType.length ) {
      return false;
    }

    const currentNoteEmrType = currentNote.emrContentType.concat().sort();
    const futureNoteEmrType = futureNote.emrContentType.concat().sort();

    for (let index in currentNoteEmrType) {
      if (currentNoteEmrType[index] !== futureNoteEmrType[index]) {
        return false;
      } 
    }

    return true;
  };

  getDataMap = (note) => {
    let parser = new DOMParser();
    let doc = parser.parseFromString(note.htmlContent, 'text/html');
    const htmlContent = doc.body;
   
    

    const problemsArray = htmlContent.getElementsByClassName('ddemrcontentitem ddremovable');

    const problems = [];

    if (problemsArray.length) {
      problemsArray.forEach((problem) => {
        
        const probObject = {
          problem: problem.innerText
        };
        
        const freeTexts = problem.getElementsByClassName('ddfreetext ddremovable');
        if (freeTexts.length) {
          freeTexts.forEach(freeText => {
            probObject.freeText = freeText.innerText;
          });
        }
        
        problems.push(probObject);
        // if (problem.attributes['dd:contenttype'].value) {
        //   note.data.set(problem.attributes['dd:contenttype'].value, problem.getElementsByClassName('ddfreetext ddremovable'));
        // }
      });
      debugger;
      problems.forEach(prob => {
        prob.problem = prob.problem.replace(`${prob.freeText}`, '');
        note.data.set(prob.problem.replace(`${prob.freeText}`, ''), prob.freeText);
      });
      console.log(problems);
    }

    
  };  

  compareHtml = () => {

    let currentNote = {
      htmlContent: `<div class="doc-WorkflowComponent-content doc-DynamicDocument-content"><div class="ddemrcontent" id="_98a480cf-d86e-408a-8abe-2c8ca9834fb4" dd:contenttype="DXORDERS" dd:extractkey="ad437262-ff0e-49b4-9801-b3d2c62d1ade" dd:referenceuuid="28ADF401-6012-454F-B8DF-CD5503253E54"><div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="2106964623" dd:contenttype="DIAGNOSES" id="_6fbff4e6-b6b2-46cb-a014-654f8847215b">Acute gastritis↵   <div style="margin-left:8px" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right" contenteditable="true" id="_c0ac97d0-4b2b-45fc-8005-1f85eb7480e1" contentEditable="true">Test text 111</div>↵   <div style="clear:both"></div>↵</div>↵<div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="2106964481" dd:contenttype="DIAGNOSES" id="_0b48c152-1369-44ee-9c13-9a27c7390515">Pain in throat and chest↵   <div style="margin-left:8px" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right" contenteditable="true" id="_f2a15188-5c5c-4042-9333-af6ccaa26c5f" contentEditable="true">&#xA0;test1234&#xA0;</div>↵   <div style="clear:both"></div>↵</div>↵</div>↵↵↵↵</div>`,
      noteHtmlArray: [],
      emrContentType: [],
      emrItems: [],
      freeTexts: [],
      data: new Map()
    };
    let futureNote = {
      htmlContent: `<div class="doc-WorkflowComponent-content doc-DynamicDocument-content"> <div class="ddemrcontent" id="_98a480cf-d86e-408a-8abe-2c8ca9834fb4" dd:contenttype="DXORDERS" dd:extractkey="ad437262-ff0e-49b4-9801-b3d2c62d1ade" dd:referenceuuid="28ADF401-6012-454F-B8DF-CD5503253E54"> <div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="2106964623" dd:contenttype="DIAGNOSES" id="_6fbff4e6-b6b2-46cb-a014-654f8847215b">Acute gastritis <div style="clear:both"></div> </div> <div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="2106964481" dd:contenttype="DIAGNOSES" id="_0b48c152-1369-44ee-9c13-9a27c7390515">Pain in throat and chest <div style="margin-left:8px" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right" contenteditable="true" id="_e7372cd8-3556-4fe4-badc-a4b5cb0a7858" contentEditable="true"> test1234 Test text 111</div> <div style="clear:both"></div> </div> </div> </div>`,
      noteHtmlArray: [],
      emrContentType: [],
      emrItems: [],
      freeTexts: [],
      data: new Map()
    };
    
    console.log("Before formatting Current Note ", currentNote.htmlContent);
    currentNote.htmlContent = this.formatHtml(currentNote.htmlContent);
    console.log("After formatting Current Note ", currentNote.htmlContent);

    console.log("Before formatting Future Note ", futureNote.htmlContent);
    futureNote.htmlContent = this.formatHtml(futureNote.htmlContent);
    console.log("After formatting Future Note ", futureNote.htmlContent);

    currentNote.noteHtmlArray = this.extractNoteHtml(currentNote.htmlContent);
    futureNote.noteHtmlArray = this.extractNoteHtml(futureNote.htmlContent);

    this.getDataMap(currentNote);
    this.getDataMap(futureNote);
    
    //Will give the free text entered
    // currentNote.data.get('DXORDERS').forEach(freeText => console.log(freeText.innerText));
    // futureNote.data.get('DXORDERS').forEach(freeText => console.log(freeText.innerText));

    // //Will give will free text div
    // currentNote.data.get('DXORDERS').forEach(freeText => console.log(freeText.outerHTML));
    // futureNote.data.get('DXORDERS').forEach(freeText => console.log(freeText.outerHTML));

    
    this.getEmrData(currentNote);
    this.getEmrData(futureNote);

    debugger;
    console.log(currentNote);
    console.log(futureNote);

    // if (currentNote.emrItems.length) {
    //   currentNote.emrItems.forEach((emrItem) => {
    //     for(let i = emrItem.emrIndex; i<=)
    //   });
    // }

    this.isBothNotesAreEqual(currentNote, futureNote) ? alert("Notes are equal") : alert("Notes are un equal");
    
    // console.log("Before Rmeoving White Space HTML1", currentNote);
    // currentNote = this.formatHtml(currentNote);
    // console.log("After Rmeoving White Space HTML1", currentNote);
    // console.log("Before Rmeoving White Space HTML2", futureNote);
    // futureNote = this.formatHtml(futureNote);
    // console.log("After Rmeoving White Space HTML2", futureNote);
    // const currentNoteHtmlArray = this.extractNoteHtml(currentNote);
    // const futureNoteHtmlArray = this.extractNoteHtml(futureNote);
    // debugger;
    // console.log(currentNoteHtmlArray);
    // console.log(futureNoteHtmlArray);
  };

  render() {

    let editor = null;
    if (this.state.showEditor) {
      editor = <div>
          <CKEditor
            type="inline"
            data={this.state.data}
            onChange={(event) => {this.changeHandler(event)}}
          />
        </div>;
    }

    return (
      <div className="App">
        <h2>Using CKEditor 4 in React</h2>
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
        <button onClick={() => alert(this.state.isDirty)}>Is Dirty.?</button>
      </div>
    );
  };
}

export default App;

//event.target.innerText
//event.target.textContent
//workflowComponents[0].querySelector('.doc-WorkflowComponent-content');


//Working logic for Simple Templte
getDataMap = (note) => {
  let parser = new DOMParser();
  let doc = parser.parseFromString(note.formattedHtmlContent, 'text/html');
  const htmlContent = doc.body;
 
  debugger;
  const problemsArray = htmlContent.getElementsByClassName('ddemrcontentitem ddremovable');
  const problems = [];

  if (problemsArray && problemsArray.length) {
    problemsArray.forEach((problem) => {
      
      const probObject = {
        problem: problem.innerText,
        freeText: []
      };
      
      const freeTexts = problem.getElementsByClassName('ddfreetext ddremovable');
      if (freeTexts.length) {
        freeTexts.forEach(freeText => {
          debugger;
          if (freeText.innerText.trim()) {
            probObject.freeText.push(freeText.innerText);
          } else {
            probObject.freeText.push('NO_DATA');
          }
          //This IF condition dint work but should be considered if we find any other placeholders for empty free text
          // if (freeText.innerText === '&nbsp;' || freeText.innerText === ' ' || freeText.innerText === '') {
          //   probObject.freeText.push('NO_DATA');
          // } else {
          //   probObject.freeText.push(freeText.innerText);
          // }
          
        });
      }
      
      problems.push(probObject);
    });
    problems.forEach(prob => {
      //prob.problem = prob.problem.replace(`${prob.freeText}`, '');
      note.data.set(prob.problem.replace(prob.freeText, ''), prob.freeText);
    });
    //=== ' ' ? 'NO_DATA'
    console.log(problems);

    //Find the generic free text
    debugger;
    const genricFreeText =  htmlContent.getElementsByClassName('doc-WorkflowComponent-content doc-DynamicDocument-content')[0]
    .getElementsByClassName('ddfreetext ddremovable');
    const genricFreeTextIndex =  genricFreeText.length - 1;

    if (genricFreeText[genricFreeTextIndex].innerText.trim()) {
      note.data.set('Generic Free Text', genricFreeText[genricFreeTextIndex].innerText);
    } else {
      note.data.set('Generic Free Text', 'NO_DATA');
    }

    //This IF condition dint work but should be considered if we find any other placeholders for empty free text
    // if (genricFreeText[genricFreeTextIndex].innerText === '&nbsp;' || genricFreeText[genricFreeTextIndex].innerText === ' '
    //     || genricFreeText[genricFreeTextIndex].innerText === '') {
    //       note.data.set('Generic Free Text', 'NO_DATA');
    // } else {
    //   note.data.set('Generic Free Text', genricFreeText[genricFreeTextIndex].innerText)
    // }
  }
}
