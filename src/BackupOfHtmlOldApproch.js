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

  //COMPARISION
  if(prob === 'Generic Free Text' && currentNote.data.get(prob) !== 'NO_DATA') {
    let futureNoteData = '';
    for (let futureNoteProb of futureNote.data.keys()) {
      if (futureNote.data.get(futureNoteProb) !== 'NO_FREE_TEXT' || futureNote.data.get(futureNoteProb) !== 'NO_DATA') {
        futureNoteData += futureNote.data.get(futureNoteProb);
      }

      if (futureNoteData && !futureNoteData.includes(currentNote.data.get(prob))) { // should we trim spaces just while checking.?
        forwardData = true;
        dataToForward.push({
          prob: prob,
          freeText: currentNote.data.get(prob)
        });
      }
    }
  }
  if (prob !== 'Generic Free Text' && futureNote.data.has(prob)) {
    if ( currentNote.data.get(prob) !== 'NO_FREE_TEXT' || currentNote.data.get(prob) !== 'NO_DATA') {
      if (futureNote.data.get(prob) === 'NO_FREE_TEXT' || ( futureNote.data.get(prob) !== 'NO_FREE_TEXT' && futureNote.data.get(prob) === 'NO_DATA') )  {
        if (!futureNote.data.get('Generic Free Text').includes(currentNote.data.get(prob))) {
          forwardData = true;
          dataToForward.push({
            prob: prob,
            freeText: currentNote.data.get(prob)
          });
        }
      } else {
         if (futureNote.data.get(prob) !== currentNote.data.get(prob)) { // should we trim spaces just while checking.?
          forwardData = true;
          dataToForward.push({
            prob: prob,
            freeText: currentNote.data.get(prob)
          });
        }
      }
    } /* if (futureNote.data.get(prob) !== currentNote.data.get(prob)) { // should we trim spaces just while checking.?
      forwardData = true;
      dataToForward.push({
        prob: prob,
        freeText: currentNote.data.get(prob)
      });
    }*/
  } else if (prob !== 'Generic Free Text' && !futureNote.data.has(prob)){
    probNotFound.push(prob);
    if ( currentNote.data.get(prob) !== 'NO_FREE_TEXT' || currentNote.data.get(prob) !== 'NO_DATA') {
      stopSwitch = true;
    }
  } 

  //IF SAVE before template switch doesn't work as expected
  let stopSwitch = false;
    let forwardData = false;
    let emrNotFound = [];
    let dataToForward = [];
    debugger;
    for (let emr of currentNote.data.keys()) {
      if (emr !== 'Generic Free Text' && futureNote.data.has(emr)) {
        if ( currentNote.data.get(emr) !== 'NO_FREE_TEXT' && currentNote.data.get(emr) !== 'NO_DATA') {
          if (futureNote.data.get(emr) === 'NO_FREE_TEXT' || ( futureNote.data.get(emr) !== 'NO_FREE_TEXT' && futureNote.data.get(emr) === 'NO_DATA') )  {
            forwardData = true;
            dataToForward.push({
              emr: emr,
              emrContent: currentNote.data.get(emr) // Merge or overwrite.?
            });
          } else {
            if (futureNote.data.get(emr) !== currentNote.data.get(emr)) { // should we trim spaces just while checking.?
              forwardData = true;
              dataToForward.push({
                  emr: emr,
                  emrContent: currentNote.data.get(emr) // Merge or overwrite.?
              });
            }
          }
        }
      } else if (emr !== 'Generic Free Text' && !futureNote.data.has(emr)){
        emrNotFound.push(emr);
        // Should stop switch only when there is data for current emr or should i stop just if the prob is missing.?
        if ( currentNote.data.get(emr) !== 'NO_FREE_TEXT' || currentNote.data.get(emr) !== 'NO_DATA') {
          stopSwitch = true;
        }
      } else if(emr === 'Generic Free Text' && currentNote.data.get(emr) !== 'NO_DATA') {
        forwardData = true;
        dataToForward.push({
            emr: emr,
            emrContent: currentNote.data.get(emr) // Merge or overwrite.?
        });
      } 
    }

}


    // If we call SAVE before switching template
    for (let emr of currentTemplate.emrData.keys()) {
      if (emr !== 'Generic Free Text' && !futureTemplate.emrData.has(emr)) {
        if ( currentTemplate.emrData.get(emr) !== 'NO_FREE_TEXT' && currentTemplate.emrData.get(emr) !== 'NO_DATA') {
          stopSwitch = true;
          emrNotFound.push(emr); // Should be removed if we are not intrested in the problem that is missing
        }
      }
    }


    // Before optimazation and after completing data carry forward
    formatHtml = (htmlString) => htmlString
    .replace(/(\n|\r|\t|\v|\f)+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/&#xA0;/g, ' ')
    .replace(/↵/g, '')// this is equivaent to '<br />' but looks good, TBV
    .trim();

  stringToHTML = (htmlString) => {
    let parser = new DOMParser();
    let doc = parser.parseFromString(htmlString, 'text/html');
    return doc.body;
  };

  getEmrFromTemplate = (note) => {
    const htmlContent = this.stringToHTML(note.htmlContent);
    
    debugger;
    // Get all the elements with class - 'demrcontentitem ddremovable'
    const emrContentItems = htmlContent.getElementsByClassName('ddemrcontentitem ddremovable');

    if (emrContentItems && emrContentItems.length) {
      const emrContents = [];
      // Filter the elements that or not emr, example Orders
      emrContentItems.forEach((emrContentItem) => {
        // Should consider emrContentItem.getAttribute('dd:contenttype') === 'DIAGNOSES' instead of emrContentItem.hasAttribute('dd:contenttype')
        // if any other tags apart from emrItems has this attribute and consider hekcing for other emrtypes as weel same as DIAGNOSES
        if(emrContentItem.getAttribute('xmlns:dd') === 'DynamicDocumentation' && emrContentItem.hasAttribute('dd:contenttype')) { 
          emrContents.push(emrContentItem)
        }   
      });
      
      if (emrContents && emrContents.length) {
        emrContents.forEach(emrContent => {
          const emrObject = { };
          let freeTextElement = '';

          // Get the emr name
          if (emrContent.childNodes && emrContent.childNodes.length && emrContent.childNodes[0].wholeText) {
            emrObject.emrItem = emrContent.childNodes[0].wholeText;
          }
          
          // Find the free text box under emr
          if (emrContent.length) {
            emrContent.forEach(element => {
              if (element.getAttribute('class') === 'ddfreetext ddremovable') {
                freeTextElement = element;
              }
            })
          } else if (emrContent.getElementsByClassName('ddfreetext ddremovable').length) {
            freeTextElement = emrContent.getElementsByClassName('ddfreetext ddremovable')[0];
          } else {
            emrObject.freeTextData = 'NO_FREE_TEXT';
          }

          if (freeTextElement) {
            if (freeTextElement.innerText.trim()) {
              emrObject.freeTextData = freeTextElement.innerText;
              emrObject.freeTextOuterHTML = freeTextElement.outerHTML;
              emrObject.freeTextInnerHTML = freeTextElement.innerHTML;
            } else {
              emrObject.freeTextData = 'NO_DATA';
            }
          }
          
          note.emrData.set(emrObject.emrItem, emrObject);
        });
      }  
    }

    //Find the generic free text
    let genricFreeText = null;
    const freeTextElements =  htmlContent.getElementsByClassName('doc-WorkflowComponent-content doc-DynamicDocument-content')[0]
      .getElementsByClassName('ddfreetext ddremovable');
    freeTextElements.forEach(freeTextElement => {
      if (freeTextElement.parentElement.getAttribute('class') === "doc-WorkflowComponent-content doc-DynamicDocument-content" ) {
        genricFreeText = freeTextElement;
      } 
    });

    if (genricFreeText.innerText.trim()) {
      note.emrData.set('Generic Free Text', {
        freeTextData: genricFreeText.innerText,
        freeTextInnerHTML: genricFreeText.innerHTML,
        freeTextOuterHTML: genricFreeText.outerHTML
      });
    } else {
      note.emrData.set('Generic Free Text', 'NO_DATA');
    }
  };

  templateSwitchHandler = () => {
    debugger;
    
    const currentTemplateHtml = WorkflowDocumentManager.getCKEditorData(this.props.conceptCki);
    // Use currentTemplateHtml instead of hardcoding here
    let currentTemplate = {
      htmlContent: this.formatHtml(`<div class="doc-WorkflowComponent-content doc-DynamicDocument-content">
    <div class="ddemrcontent" id="_bfb53c88-05af-4a83-940d-ee85b270f608" dd:contenttype="DXORDERS" dd:referenceuuid="28ADF401-6012-454F-B8DF-CD5503253E54">
        <div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="28495465" dd:contenttype="DIAGNOSES">1.&#160;DX - 2 (Axis I diagnosis)
            <div style="clear:both"></div>
        </div>
        <div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="28495471" dd:contenttype="DIAGNOSES">3.&#160;DX - 3 (Axis I diagnosis)
        <div style="margin-left:8px" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right" id="_7167d6e0-97ed-49aa-b1eb-e6cc1eccc9e0" contenteditable="true" data-nusa-concept-name="assessment plan">&nbsp;</div>
            <div style="clear:both"></div>
        </div>
        <div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="2105554153" dd:contenttype="DIAGNOSES" id="_8c56b659-e175-412f-a90b-c894b135d827">Chronic fever
            <div style="margin-left:8px" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right" id="_7167d6e0-97ed-49aa-b1eb-e6cc1eccc9e0" contenteditable="true" data-nusa-concept-name="assessment plan">&nbsp;Temperature of 102, with no other symptoms</div>
            <div style="clear:both"></div>
        </div>
        <div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="28495795" dd:contenttype="DIAGNOSES">3.&#160;Eyelid retraction (Axis I diagnosis)
              <div style="margin-left:8px" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right">Feverish cold </div>
              <div>
                  <div style="display:table-cell;*float:left;padding-left:8px;padding-right:10px">Ordered: </div>
                  <div style="display:table-cell;*float:left">
                      <div class="ddemrcontentitem ddremovable" dd:entityid="2171389921" dd:contenttype="MEDICATIONS">diphtheria/pertussis,acel/tetanus/polio, 10 mg =, Buccal, 2-4x/Day, Start Date/Time: 09/11/18 8:00:00 CDT</div>
                  </div>
              </div>
              <div style="clear:both"><span> &#160;</span></div>
        </div>
        <div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="28495821" dd:contenttype="DIAGNOSES">4.&#160;Pain and other conditions associated with female genital organs and menstrual cycle
              <div style="margin-left:8px" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right">Fracture in right hand</div>
              <div>
                  <div style="display:table-cell;*float:left;padding-left:8px;padding-right:10px">Ordered: </div>
                  <div style="display:table-cell;*float:left">
                      <div class="ddemrcontentitem ddremovable" dd:entityid="2171389947" dd:contenttype="MEDICATIONS">acetaminophen, 890 mg, Aerosol, Oral, q4-6hr, Start Date/Time: 09/12/18, Future Order, 09/12/18 1:00:00 CDT</div>
                  </div>
              </div>
              <div style="clear:both"><span> &#160;</span></div>
          </div>
        <div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="2080117899" dd:contenttype="DIAGNOSES" id="_8c93e9d2-a179-4d76-bde2-0b27c6364d6d">Gas (Complaint of)
            <div style="margin-left:8px" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right" id="_92a752e3-0afb-4ff6-a9ac-7a92243c8527" contenteditable="true">Burning Throt</div>
            <div style="clear:both"></div>
        </div>
    </div>
    <div id="abf85d7f-7f49-f060-9e37-5e9d06ec5d9c" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right" contenteditable="true">Pain associated with micturition<br><br>Feverish cold</div>
</div>`),
      emrData: new Map()
    };
    let futureTemplate = {
      htmlContent: this.formatHtml(`<div class="doc-WorkflowComponent-content doc-DynamicDocument-content">
      <div class="ddemrcontent" id="_bfb53c88-05af-4a83-940d-ee85b270f608" dd:contenttype="DXORDERS" dd:referenceuuid="28ADF401-6012-454F-B8DF-CD5503253E54">
          <div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="2105554153" dd:contenttype="DIAGNOSES" id="_8c56b659-e175-412f-a90b-c894b135d827">Chronic fever
              <div style="clear:both"></div>
          </div>
          <div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="28495795" dd:contenttype="DIAGNOSES">3.&#160;Eyelid retraction (Axis I diagnosis)
              <div style="margin-left:8px" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right">&nbsp;</div>
              <div>
                  <div style="display:table-cell;*float:left;padding-left:8px;padding-right:10px">Ordered: </div>
                  <div style="display:table-cell;*float:left">
                      <div class="ddemrcontentitem ddremovable" dd:entityid="2171389921" dd:contenttype="MEDICATIONS">diphtheria/pertussis,acel/tetanus/polio, 10 mg =, Buccal, 2-4x/Day, Start Date/Time: 09/11/18 8:00:00 CDT</div>
                  </div>
              </div>
              <div style="clear:both"><span> &#160;</span></div>
          </div>
          <div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="28495821" dd:contenttype="DIAGNOSES">4.&#160;Pain and other conditions associated with female genital organs and menstrual cycle
              <div style="margin-left:8px" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right">Dummy DATA</div>
              <div>
                  <div style="display:table-cell;*float:left;padding-left:8px;padding-right:10px">Ordered: </div>
                  <div style="display:table-cell;*float:left">
                      <div class="ddemrcontentitem ddremovable" dd:entityid="2171389947" dd:contenttype="MEDICATIONS">acetaminophen, 890 mg, Aerosol, Oral, q4-6hr, Start Date/Time: 09/12/18, Future Order, 09/12/18 1:00:00 CDT</div>
                  </div>
              </div>
              <div style="clear:both"><span> &#160;</span></div>
          </div>
      </div>
      <div id="abf85d7f-7f49-f060-9e37-5e9d06ec5d9c" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right" contenteditable="true">Pain </div>
  </div>`),
      emrData: new Map()
    };
    
    this.getEmrFromTemplate(currentTemplate);
    this.getEmrFromTemplate(futureTemplate);

    let stopSwitch = false;
    
    let upadatedFutureHtml = this.stringToHTML(futureTemplate.htmlContent);

    const emrContentItems = upadatedFutureHtml.getElementsByClassName('ddemrcontentitem ddremovable');
    const problems = [];
    if (emrContentItems && emrContentItems.length) {
      // Filter the elements that or not emr, example Orders
      emrContentItems.forEach((emrContentItem) => {
        // SHould consider emrContentItem.getAttribute('dd:contenttype') === 'DIAGNOSES' instead of emrContentItem.hasAttribute('dd:contenttype')
        // if any other tags apart from emrItems has this attribute and consider hekcing for other emrtypes as weel same as DIAGNOSES        // 
        if(emrContentItem.getAttribute('xmlns:dd') === 'DynamicDocumentation' && emrContentItem.hasAttribute('dd:contenttype')) { 
          problems.push(emrContentItem)
        }   
      });
    }

    // WITHOUT SAVE
    for (let emr of currentTemplate.emrData.keys()) {
      if (emr !== 'Generic Free Text' && futureTemplate.emrData.has(emr) ){
        if ( currentTemplate.emrData.get(emr).freeTextData !== 'NO_FREE_TEXT' && currentTemplate.emrData.get(emr).freeTextData !== 'NO_DATA') {
          // If problem doesn't have free text box, forward current template's free text outerHtml
          if (futureTemplate.emrData.get(emr).freeTextData === 'NO_FREE_TEXT') {
              problems.forEach(problem => {
                if (problem.childNodes[0].wholeText.trim() === emr.trim()) {
                  debugger;
                  let htmlContent = this.stringToHTML(currentTemplate.emrData.get(emr).freeTextOuterHTML);
                  problem.insertBefore(htmlContent.getElementsByTagName('div')[0], problem.firstElementChild);
                }
              });
          } else { // If problem has a free text box, forward current template's free text innerHtml
            problems.forEach(problem => {
              if (problem.childNodes[0].wholeText.trim() === emr.trim()) {
                debugger;
                problem.firstElementChild.innerHTML = currentTemplate.emrData.get(emr).freeTextInnerHTML;
              }
            });
          }
        }
      } else if (emr !== 'Generic Free Text' && !futureTemplate.emrData.has(emr)) {
        if ( currentTemplate.emrData.get(emr).freeTextData !== 'NO_FREE_TEXT' && currentTemplate.emrData.get(emr).freeTextData !== 'NO_DATA') {
          stopSwitch = true;
        }
      } else if (emr === 'Generic Free Text' && currentTemplate.emrData.get(emr).freeTextData !== 'NO_DATA') {
        // Should be revisited to carryforward the box if it isn't present in future template
        let genricFreeText = null;
        const freeTextElements = upadatedFutureHtml.getElementsByClassName('doc-WorkflowComponent-content doc-DynamicDocument-content')[0]
          .getElementsByClassName('ddfreetext ddremovable');
        freeTextElements.forEach(freeTextElement => {
          if (freeTextElement.parentElement.getAttribute('class') === "doc-WorkflowComponent-content doc-DynamicDocument-content" ) {
            genricFreeText = freeTextElement;
          } 
        });
        genricFreeText.innerHTML = currentTemplate.emrData.get(emr).freeTextInnerHTML
      } 
    }

    // Converting DOM to string and remving the <body> tag added by XMLSerializer
    let oSerializer = new XMLSerializer();
    upadatedFutureHtml = oSerializer.serializeToString(upadatedFutureHtml)
      .replace(/<body[^>]+\?>/i, '').replace(/<\/body>/i, '').replace(/<[//]{0,1}(BODY|body)[^><]*>/g, "");

    if (stopSwitch) {
      this.showNotificationDialog({
        header: "Warning",
        title: 'Data Loss',
        startMessage: 'You selected a template that does not include the same sections as your current template. Changes will be lost if you switch templates. How do you want to proceed?',
        acceptText: 'Discard Changes',
        acceptHandler: () => {
          this.setState({
            notificationDialog: null,
            //$$$$
            myHtmlContent: upadatedFutureHtml
          });
        },
        rejectText: 'Cancel',
        rejectHandler: () => {
          this.setState({
            //$$$$
            notificationDialog: null
          })
        }
      });
    } else {
      this.setState({
        // $$$$$
        myHtmlContent: upadatedFutureHtml
      });
    }
  }


  // WITH SAVE
  for (let emr of currentNote.data.keys()) {
    if (emr !== 'Generic Free Text' && !futureNote.data.has(emr)) {
      if ( currentNote.data.get(emr) !== 'NO_FREE_TEXT' && currentNote.data.get(emr) !== 'NO_DATA') {
        stopSwitch = true;
        emrNotFound.push(emr); // Could be removed if we are not intrested in the problem that is missing
      }
    }
  }

  let stopSwitch = false;
    let emrNotFound = [];

  // WITHOUT SAVE
  debugger;
  for (let emr of currentNote.data.keys()) {
    if (emr !== 'Generic Free Text' && futureNote.data.has(emr) ){
      if ( currentNote.data.get(emr).freeTextData !== 'NO_FREE_TEXT' && currentNote.data.get(emr).freeTextData !== 'NO_DATA') {
        // If problem doesn't have free text box, forward current template's free text outerHtml
        if (futureNote.data.get(emr).freeTextData === 'NO_FREE_TEXT') {
          debugger;
          problems.forEach(problem => {
            if (problem.innerText.trim() === emr.trim()) {
              debugger;
              let parser = new DOMParser();
              let doc = parser.parseFromString(currentNote.data.get(emr).freeTextOuterHTML, 'text/html');
              
              problem.insertBefore(doc.body.getElementsByTagName('div')[0], problem.firstElementChild);
            }
          });
        } else { // If problem has a free text box, forward current template's free text innerHtml
          debugger;
          problems.forEach(problem => {
            if (problem.innerText.trim() === emr.trim()) {
              debugger;
              problem.firstElementChild.innerHTML = currentNote.data.get(emr).freeTextInnerHTML;
            }
          });

        }
      }
    } else if (emr !== 'Generic Free Text' && !futureNote.data.has(emr)) {
      if ( currentNote.data.get(emr).freeTextData !== 'NO_FREE_TEXT' && currentNote.data.get(emr).freeTextData !== 'NO_DATA') {
        // SHow Data Loss Warning
        stopSwitch = true;
      }
    } else if (emr === 'Generic Free Text' && currentNote.data.get(emr).freeTextData !== 'NO_DATA') {
      // Overwrite to future
      debugger;
      // const genricFreeText = upadatedFutureHtml.getElementsByClassName('doc-WorkflowComponent-content doc-DynamicDocument-content')[0]
      //   .getElementsByClassName('ddfreetext ddremovable');
      // const genricFreeTextIndex =  genricFreeText.length - 1;
      let genricFreeText = null;
      const freeTextElements = upadatedFutureHtml.getElementsByClassName('doc-WorkflowComponent-content doc-DynamicDocument-content')[0]
        .getElementsByClassName('ddfreetext ddremovable');
      freeTextElements.forEach(freeTextElement => {
        if (freeTextElement.parentElement.getAttribute('class') === "doc-WorkflowComponent-content doc-DynamicDocument-content" ) {
          genricFreeText = freeTextElement;
        } 
      });
      genricFreeText.innerHTML = currentNote.data.get(emr).freeTextInnerHTML
    } 
  }
  debugger;
  console.log(upadatedFutureHtml);
  console.log(problems);

  let oSerializer = new XMLSerializer();
  upadatedFutureHtml = oSerializer.serializeToString(upadatedFutureHtml)
    .replace(/<body[^>]+\?>/i, '').replace(/<\/body>/i, '').replace(/<[//]{0,1}(BODY|body)[^><]*>/g, "");
  console.log("FINAL********")
  console.log(upadatedFutureHtml);

  if (stopSwitch) {
    //Show warning
  } else {
    // Update data prop to send this as html
    this.setState({
      data: futureNote.htmlContent
    })
  }
  
  console.log('Stop Switch ',stopSwitch);
  console.log('Problems Not Found ', emrNotFound);

  getDataMap = (note) => {
    let parser = new DOMParser();
    let doc = parser.parseFromString(note.htmlContent, 'text/html');
    const htmlContent = doc.body;
    debugger;
    // htmlContent.getElementsByClassName('ddfreetext ddremovable')[2].innerHTML = "Feverless cold <br><br>Fracture in left hand<br>"
    //debugger;
    // Get all the elements with class - 'demrcontentitem ddremovable'
    const emrContentItems = htmlContent.getElementsByClassName('ddemrcontentitem ddremovable');
    const emrDatas = [];

    if (emrContentItems && emrContentItems.length) {
      const emrContents = [];
      // Filter the elements that or not emr, example Orders
      emrContentItems.forEach((emrContentItem) => {
        debugger;
        // SHould consider emrContentItem.getAttribute('dd:contenttype') === 'DIAGNOSES' instead of emrContentItem.hasAttribute('dd:contenttype')
        // if any other tags apart from emrItems has this attribute and consider hekcing for other emrtypes as weel same as DIAGNOSES        // 
        if(emrContentItem.getAttribute('xmlns:dd') === 'DynamicDocumentation' && emrContentItem.hasAttribute('dd:contenttype')) { 
          emrContents.push(emrContentItem)
        }   
      });
      
      if (emrContents && emrContents.length) {
        emrContents.forEach(emrContent => {
          const emrObject = { };
          let freeTextElement = '';

          // Get the emr data
          if (emrContent.childNodes && emrContent.childNodes.length && emrContent.childNodes[0].wholeText) {
            emrObject.emrItem = emrContent.childNodes[0].wholeText;
          }
          
          // Find the free text box under emr
          if (emrContent.length) {
            emrContent.forEach(element => {
              if (element.getAttribute('class') === 'ddfreetext ddremovable') {
                freeTextElement = element;
              }
            })
          } else if (emrContent.getElementsByClassName('ddfreetext ddremovable').length) {
            freeTextElement = emrContent.getElementsByClassName('ddfreetext ddremovable')[0];
          } else {
            emrObject.freeTextData = 'NO_FREE_TEXT'
          }
          if (freeTextElement) {
            if (freeTextElement.innerText.trim()) {
              emrObject.freeTextData = freeTextElement.innerText;
              emrObject.freeTextOuterHTML = freeTextElement.outerHTML;
              emrObject.freeTextInnerHTML = freeTextElement.innerHTML;
            } else {
              emrObject.freeTextData = 'NO_DATA';
            }
          }
          
          note.data.set(emrObject.emrItem, emrObject);
          //emrDatas.push(emrObject);  
        });
      }  

      // emrDatas.forEach(emrData => {
      //   //prob.problem = prob.problem.replace(`${prob.freeText}`, '');
      //   note.data.set(emrData.emrItem, emrData.freeText);
      // });
      //=== ' ' ? 'NO_DATA'
      console.log(emrDatas);
    }

    debugger;
    //Find the generic free text
    // const genricFreeText = htmlContent.getElementsByClassName('doc-WorkflowComponent-content doc-DynamicDocument-content')[0]
    //   .getElementsByClassName('ddfreetext ddremovable');
    // const genricFreeTextIndex =  genricFreeText.length - 1;

    let genricFreeText = null;
    const freeTextElements = htmlContent.getElementsByClassName('doc-WorkflowComponent-content doc-DynamicDocument-content')[0]
      .getElementsByClassName('ddfreetext ddremovable');
    freeTextElements.forEach(freeTextElement => {
       if (freeTextElement.parentElement.getAttribute('class') === "doc-WorkflowComponent-content doc-DynamicDocument-content" ) {
        genricFreeText = freeTextElement;
       } 
    });


    if (genricFreeText.innerText.trim()) {
      note.data.set('Generic Free Text', {
        freeTextData: genricFreeText.innerText,
        freeTextInnerHTML: genricFreeText.innerHTML,
        freeTextOuterHTML: genricFreeText.outerHTML
      });
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

    console.log(htmlContent);
    console.log(note.data);
  };

  // GET Generi FreeText old way
  getGenericFreeTextElement = (htmlContent) => {
    // $$$$$ This works fine if we get this under root div, is there a chance it go under some other element???
    let genricFreeTextElement = null;
    htmlContent.getElementsByClassName('doc-WorkflowComponent-content doc-DynamicDocument-content')[0]
      .getElementsByClassName('ddfreetext ddremovable').forEach(freeTextElement => {
        if (freeTextElement.parentElement.getAttribute('class') === "doc-WorkflowComponent-content doc-DynamicDocument-content" ) {
          genricFreeTextElement = freeTextElement;
        } 
      });
    return genricFreeTextElement;
  };

  function publishCKEditorChange(event) {
    // if (this.state.resetUndoRedo) {
    //   this.resetUndoSnapshot();
    //   this.setState({
    //     resetUndoRedo: false
    //   });
    // } else {
    //   this.context.ckeditorChangeEvent(event);
    // }
    this.context.ckeditorChangeEvent(event);
  }


  // WorkfloComponentContainer - Before Optimization 04/09/2020

  /**
   * This function removes any spaces and replaces unicodes.
   * @param {string} htmlString - An html string. 
   * @returns {string} - string with no extra spaces and unicodes replaced with string equivalent.
   */
  formatHtml = (htmlString) => htmlString
    .replace(/(\n|\r|\t|\v|\f)+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/&#xA0;/g, ' ')
    .replace(/↵/g, '')
    .trim();

  /**
   * This function converts the html string to Document.
   * @param {string} htmlString - An html string.
   * @returns {Document} - Document version of the passed in html in string.
   */
  stringToHTML = (htmlString) => {
    let parser = new DOMParser();
    let doc = parser.parseFromString(htmlString, 'text/html');
    return doc.body;
  };

  /**
   * This function gets all the EMR elements and filters other elements.
   * @param {array} emrContentItems - Array containing the elements wiht class 'ddemrcontentitem ddremovable'.
   * @returns {emrContents} - array containing the EMR elements.
   */
  getEmrContents = (emrContentItems) => {
    const emrContents = [];
    // Filter the elements that or not emr, example Orders
    emrContentItems.forEach((emrContentItem) => {
      // Should consider emrContentItem.getAttribute('dd:contenttype') === 'DIAGNOSES' instead of emrContentItem.hasAttribute('dd:contenttype')
      // if any other tags apart from emrItems has this attribute and consider hekcing for other emrtypes as weel same as DIAGNOSES
      if(emrContentItem.getAttribute('xmlns:dd') === 'DynamicDocumentation' && emrContentItem.hasAttribute('dd:contenttype')) { 
        emrContents.push(emrContentItem)
      }   
    });
    return emrContents;
  };

  /**
   * This function gets all the EMR and its data and store it to a map which will be used to compare with.
   * the newly selected template's data to check for the data loss and to copy forward the user entered data.
   * @param {HTMLElement} htmlContent - HTMLElement.
   * @returns {object} - Object contining free text element and its position.
   */
  getGenericFreeTextElement = (htmlContent) => {
    let genricFreeText = {};
    htmlContent.getElementsByClassName('doc-WorkflowComponent-content doc-DynamicDocument-content')[0].children.forEach((freeTextElement, index) => {
        if (freeTextElement.getAttribute('class') === "ddfreetext ddremovable") {
            genricFreeText.element = freeTextElement
            genricFreeText.index = index;
        } 
      });
    return genricFreeText;
  };

  /**
   * This function gets all the EMRs & its data and store it to a map which will be used to compare with.
   * the newly selected template's data to check for the data loss and to copy forward the user entered data.
   * @param {object} note - Object containing html content and a map to store the EMR data.
   * @returns {undefined}
   */
  getEmrFromTemplate = (note) => {
    const htmlContent = this.stringToHTML(note.htmlContent);
    
    const emrContentItems = htmlContent.getElementsByClassName('ddemrcontentitem ddremovable');

    if (emrContentItems && emrContentItems.length) {
      
      const emrContents = this.getEmrContents(emrContentItems);
      
      if (emrContents && emrContents.length) {
        emrContents.forEach(emrContent => {
          const emrObject = { };
          let freeTextElement = '';

          // Get the emr name
          if (emrContent.childNodes && emrContent.childNodes.length && emrContent.childNodes[0].wholeText) {
            emrObject.emrItem = emrContent.childNodes[0].wholeText.trim();
          }
          
          // Find the free text box under emr
          if (emrContent.length) {
            emrContent.forEach(element => {
              if (element.getAttribute('class') === 'ddfreetext ddremovable') {
                freeTextElement = element;
              }
            })
          } else if (emrContent.getElementsByClassName('ddfreetext ddremovable').length) {
            freeTextElement = emrContent.getElementsByClassName('ddfreetext ddremovable')[0];
          } else {
            emrObject.freeTextData = 'NO_FREE_TEXT';
          }

          if (freeTextElement) {
            if (freeTextElement.innerText.trim()) {
              emrObject.freeTextData = freeTextElement.innerText;
              emrObject.freeTextOuterHTML = freeTextElement.outerHTML;
              emrObject.freeTextInnerHTML = freeTextElement.innerHTML;
            } else {
              emrObject.freeTextData = 'NO_DATA';
            }
          }
          
          note.emrData.set(emrObject.emrItem, emrObject);
        });
      }  
    }

    let genricFreeText = this.getGenericFreeTextElement(htmlContent);
    if (genricFreeText.element === undefined) {
      note.emrData.set('Generic Free Text', {
        freeTextData: 'NO_FREE_TEXT'
      });
    } else if (genricFreeText.element && genricFreeText.element.innerText.trim()) {
      note.emrData.set('Generic Free Text', {
        freeTextIndex: genricFreeText.index,
        freeTextData: genricFreeText.element.innerText,
        freeTextInnerHTML: genricFreeText.element.innerHTML,
        freeTextOuterHTML: genricFreeText.element.outerHTML
      }); 
    } else {
      note.emrData.set('Generic Free Text', {
        freeTextData: 'NO_DATA'
      });
    }
  };

  /**
   * This function get the selected template data and updates the CKEditor content, if there is no data loss.
   * IF there is a data loss it shows a Notification dialoge with data loss waring.
   * @param {number} selectedTemplateID - selected template id.
   * @returns {undefined}
   */
  templateSwitchHandler = (selectedTemplateID) => {
    const currentTemplateHtml = WorkflowDocumentManager.getCKEditorData(this.props.conceptCki);
    
    let currentTemplate = {
      htmlContent: this.formatHtml(currentTemplateHtml),
      emrData: new Map()
    };
    let futureTemplate = {
      htmlContent: this.formatHtml(`<div class="doc-WorkflowComponent-content doc-DynamicDocument-content">
      <div id="abf85d7f-7f49-f060-9e37-5e9d06ec5d9c" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right" contenteditable="true">Pain </div>
      <div class="ddemrcontent" id="_bfb53c88-05af-4a83-940d-ee85b270f608" dd:contenttype="DXORDERS" dd:referenceuuid="28ADF401-6012-454F-B8DF-CD5503253E54">
          <div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="2105554153" dd:contenttype="DIAGNOSES" id="_8c56b659-e175-412f-a90b-c894b135d827">Chronic fever
              <div style="clear:both"></div>
          </div>
          <div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="2120591875" dd:contenttype="DIAGNOSES" id="_26043a5c-7169-445a-939b-7f8173e1982c">Acute chest pain
            <div style="margin-left:8px" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right">&nbsp;</div>
            <div style="clear:both"></div>
          </div>
          <div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="28495795" dd:contenttype="DIAGNOSES">3.&#160;Eyelid retraction (Axis I diagnosis)
              <div style="margin-left:8px" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right">&nbsp;</div>
              <div>
                  <div style="display:table-cell;*float:left;padding-left:8px;padding-right:10px">Ordered: </div>
                  <div style="display:table-cell;*float:left">
                      <div class="ddemrcontentitem ddremovable" dd:entityid="2171389921" dd:contenttype="MEDICATIONS">diphtheria/pertussis,acel/tetanus/polio, 10 mg =, Buccal, 2-4x/Day, Start Date/Time: 09/11/18 8:00:00 CDT</div>
                  </div>
              </div>
              <div style="clear:both"><span> &#160;</span></div>
          </div>
          <div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="28495821" dd:contenttype="DIAGNOSES">4.&#160;Pain and other conditions associated with female genital organs and menstrual cycle
              <div style="margin-left:8px" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right">Dummy DATA</div>
              <div>
                  <div style="display:table-cell;*float:left;padding-left:8px;padding-right:10px">Ordered: </div>
                  <div style="display:table-cell;*float:left">
                      <div class="ddemrcontentitem ddremovable" dd:entityid="2171389947" dd:contenttype="MEDICATIONS">acetaminophen, 890 mg, Aerosol, Oral, q4-6hr, Start Date/Time: 09/12/18, Future Order, 09/12/18 1:00:00 CDT</div>
                  </div>
              </div>
              <div style="clear:both"><span> &#160;</span></div>
          </div>
      </div>
  </div>`),
      emrData: new Map()
    };

    this.getEmrFromTemplate(currentTemplate);
    this.getEmrFromTemplate(futureTemplate);

    let stopSwitch = false;
    let shouldCompare = false;

    for (let emrData of currentTemplate.emrData.values()) {
      if (emrData.freeTextData !== 'NO_FREE_TEXT' && emrData.freeTextData !== 'NO_DATA') {
        shouldCompare = true;
        break;
      }
    }

    if (shouldCompare) {
      let upadatedFutureHtml = this.stringToHTML(futureTemplate.htmlContent);

      const emrContentItems = upadatedFutureHtml.getElementsByClassName('ddemrcontentitem ddremovable');
      
      const emrContents = this.getEmrContents(emrContentItems);

      for (let emr of currentTemplate.emrData.keys()) {
        if (emr !== 'Generic Free Text' && futureTemplate.emrData.has(emr) ){
          if ( currentTemplate.emrData.get(emr).freeTextData !== 'NO_FREE_TEXT' && currentTemplate.emrData.get(emr).freeTextData !== 'NO_DATA') {
            // If EMR doesn't have free text box, copy forward the current template's free text/outerHTML
            if (futureTemplate.emrData.get(emr).freeTextData === 'NO_FREE_TEXT') {
              emrContents.forEach(emrContent => {
                  if (emrContent.childNodes[0].wholeText.trim() === emr.trim()) {
                    let htmlContent = this.stringToHTML(currentTemplate.emrData.get(emr).freeTextOuterHTML);
                    emrContent.insertBefore(htmlContent.getElementsByTagName('div')[0], emrContent.firstElementChild);
                  }
                });
            } else { // If EMR has the free text box, copy forward current template's free text data/innerHTML
              emrContents.forEach(emrContent => {
                if (emrContent.childNodes[0].wholeText.trim() === emr.trim()) {
                  emrContent.firstElementChild.innerHTML = currentTemplate.emrData.get(emr).freeTextInnerHTML;
                }
              });
            }
          }
        } else if (emr !== 'Generic Free Text' && !futureTemplate.emrData.has(emr)) {
          if ( currentTemplate.emrData.get(emr).freeTextData !== 'NO_FREE_TEXT' && currentTemplate.emrData.get(emr).freeTextData !== 'NO_DATA') {
            stopSwitch = true;
          }
        } else if (emr === 'Generic Free Text' && currentTemplate.emrData.get(emr).freeTextData !== 'NO_FREE_TEXT' && currentTemplate.emrData.get(emr).freeTextData !== 'NO_DATA') {
          if (futureTemplate.emrData.get(emr).freeTextData === 'NO_FREE_TEXT') {
            // Place at beginning in future template
            if (currentTemplate.emrData.get(emr).freeTextIndex === 0) {
              const htmlContent = this.stringToHTML(currentTemplate.emrData.get(emr).freeTextOuterHTML);
              const parentDiv = upadatedFutureHtml.getElementsByClassName('doc-WorkflowComponent-content doc-DynamicDocument-content')[0]
              parentDiv.insertBefore(htmlContent.getElementsByTagName('div')[0], parentDiv.firstElementChild);
            } else {
              // Place at the end in future template
              const htmlContent = this.stringToHTML(currentTemplate.emrData.get(emr).freeTextOuterHTML);
              const parentDiv = upadatedFutureHtml.getElementsByClassName('doc-WorkflowComponent-content doc-DynamicDocument-content')[0]
              parentDiv.insertBefore(htmlContent.getElementsByTagName('div')[0], null);
            }
          } else {
            const genricFreeText = this.getGenericFreeTextElement(upadatedFutureHtml);
            genricFreeText.element.innerHTML = currentTemplate.emrData.get(emr).freeTextInnerHTML;
          }
        } 
      }

      // Converting DOM to string and removing the <body> tag added by XMLSerializer during converstion
      let oSerializer = new XMLSerializer();
      upadatedFutureHtml = oSerializer.serializeToString(upadatedFutureHtml)
        .replace(/<body[^>]+\?>/i, '').replace(/<\/body>/i, '').replace(/<[//]{0,1}(BODY|body)[^><]*>/g, "");

      if (stopSwitch) {
        const notificationDialogProps = {
          header: this.props.intl.formatMessage({ id: 'workflow-component.ap.header_dirty_data_context_change_or_exit' }),
          title:  this.props.intl.formatMessage({ id: 'workflow-component.ap.title_dirty_data_context_change_or_exit' }),
          startMessage: this.props.intl.formatMessage({ id: 'workflow-component.ap.message_dirty_data_context_change_or_exit' }),
          acceptText: this.props.intl.formatMessage({ id: 'workflow-component.ap_accept_action_text_dirty_data_context_change_or_exit' }),
          acceptHandler: () => {
            this.setState({
              notificationDialog: null,
              resetUndoRedo: true,
              seletedTemplate: selectedTemplateID,
              myHtmlContent: upadatedFutureHtml
            });
          },
          rejectText: this.props.intl.formatMessage({ id: 'workflow-component.ap_reject_action_text_dirty_data_context_change_or_exit' }),
          rejectHandler: () => {
            this.setState({
              notificationDialog: null
            })
          }
        };
        this.showNotificationDialog(notificationDialogProps);
      } else {
        this.setState({
          resetUndoRedo: true,
          seletedTemplate: selectedTemplateID,
          myHtmlContent: upadatedFutureHtml
        });
      }
    } else {
      this.setState({
        resetUndoRedo: true,
        seletedTemplate: selectedTemplateID,
        myHtmlContent: futureTemplate.htmlContent
      });
    }
  }