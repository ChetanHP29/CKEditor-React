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

  formatHtml = (htmlString) => htmlString
    .replace(/(\n|\r|\t|\v|\f)+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/&#xA0;/g, ' ')
    .replace(/↵/g, '')// this is equivaent to '<br />' but looks good, TBV
    //.replace(/&nbsp;/g, 'NODATA') // &nbsp to be verified if it replace other space
    .trim();

  getDataMap = (note) => {
    let parser = new DOMParser();
    let doc = parser.parseFromString(note.formattedHtmlContent, 'text/html');
    const htmlContent = doc.body;
   
    debugger;
    const problemsArray = htmlContent.getElementsByClassName('ddemrcontentitem ddremovable');
    const problems = [];

    if (problemsArray.length) {
      problemsArray.forEach((problem) => {
        
        const probObject = {
          problem: problem.innerText,
          freeText: []
        };
        
        const freeTexts = problem.getElementsByClassName('ddfreetext ddremovable');
        if (freeTexts.length) {
          freeTexts.forEach(freeText => {
            debugger;
            if (freeText.innerText === '&nbsp;' || freeText.innerText === ' ' || freeText.innerText === '') {
              probObject.freeText.push('NO_DATA');
            } else {
              probObject.freeText.push(freeText.innerText);
            }
            
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
    }

    //Find the generic free text
    debugger;
    const genricFreeText =  htmlContent.getElementsByClassName('doc-WorkflowComponent-content doc-DynamicDocument-content')[0]
    .getElementsByClassName('ddfreetext ddremovable');
    const genricFreeTextIndex =  genricFreeText.length - 1;
    if (genricFreeText[genricFreeTextIndex].innerText === '&nbsp;' || genricFreeText[genricFreeTextIndex].innerText === ' '
        || genricFreeText[genricFreeTextIndex].innerText === '') {
          note.data.set('Generic Free Text', 'NO_DATA');
    } else {
      note.data.set('Generic Free Text', genricFreeText[genricFreeTextIndex].innerText)
    }

    debugger;
    console.log(htmlContent);
    console.log(note.data);
  };  
  

  compareHtml = () => {

    let currentNote = {
      htmlContent: `<div class="doc-WorkflowComponent-content doc-DynamicDocument-content"><div class="ddemrcontent" id="_98a480cf-d86e-408a-8abe-2c8ca9834fb4" dd:contenttype="DXORDERS" dd:extractkey="ad437262-ff0e-49b4-9801-b3d2c62d1ade" dd:referenceuuid="28ADF401-6012-454F-B8DF-CD5503253E54"><div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="2106964623" dd:contenttype="DIAGNOSES" id="_6fbff4e6-b6b2-46cb-a014-654f8847215b">Acute gastritis↵   <div style="margin-left:8px" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right" contenteditable="true" id="_c0ac97d0-4b2b-45fc-8005-1f85eb7480e1" contentEditable="true">Test text 111</div>↵   <div style="clear:both"></div>↵</div>↵<div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="2106964481" dd:contenttype="DIAGNOSES" id="_0b48c152-1369-44ee-9c13-9a27c7390515">Pain in throat and chest↵   <div style="margin-left:8px" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right" contenteditable="true" id="_f2a15188-5c5c-4042-9333-af6ccaa26c5f" contentEditable="true">&#xA0;test1234&#xA0;</div>↵   <div style="clear:both"></div>↵</div>↵</div>↵↵↵↵<div id="abf85d7f-7f49-f060-9e37-5e9d06ec5d9c" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right" contenteditable="true"></div>&nbsp;</div>`,
      formattedHtmlContent: '',
      data: new Map()
    };
    let futureNote = {
      htmlContent: `<div class="doc-WorkflowComponent-content doc-DynamicDocument-content">
    <div class="ddemrcontent" id="_bfb53c88-05af-4a83-940d-ee85b270f608" dd:contenttype="DXORDERS" dd:referenceuuid="28ADF401-6012-454F-B8DF-CD5503253E54">
      <div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="2105554153" dd:contenttype="DIAGNOSES" id="_2b94919e-d5e3-48b8-a5a1-2e4515013295">
              Chronic fever
              <div style="margin-left:8px" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right" id="_d4d41df6-752f-42c3-86df-93ab6f42486a" contenteditable="true" data-nusa-concept-name="assessment plan">&nbsp;T1 T2</div>
        <div style="clear:both"></div>
      </div>
      <div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="2080117899" dd:contenttype="DIAGNOSES" id="_3c3e89dc-640a-465d-be57-894940d99f87">
              Gas (Complaint of)
          <div style="margin-left:8px" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right" id="_8bef9089-6ddc-4f41-b4e9-78368baa19eb" contenteditable="true">&nbsp;Test text in the editor. Dirty Check.? HPC</div>
        <div style="clear:both"></div>
      </div>
    </div>
      <div id="abf85d7f-7f49-f060-9e37-5e9d06ec5d9c" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right" contenteditable="true">&nbsp;</div>
  </div>`,
    formattedHtmlContent: '',
      data: new Map()
    };
    
    console.log("Before formatting Current Note ", currentNote.htmlContent);
    currentNote.formattedHtmlContent = this.formatHtml(currentNote.htmlContent);
    console.log("After formatting Current Note ", currentNote.htmlContent);

    console.log("Before formatting Future Note ", futureNote.htmlContent);
    futureNote.formattedHtmlContent = this.formatHtml(futureNote.htmlContent);
    console.log("After formatting Future Note ", futureNote.htmlContent);

    this.getDataMap(currentNote);
    this.getDataMap(futureNote);
    
    debugger;
    console.log(currentNote);
    console.log(futureNote);
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
