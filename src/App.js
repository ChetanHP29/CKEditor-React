import React, { Component } from 'react';
import CKEditor from 'ckeditor4-react';
import parse from 'html-react-parser';

import './App.css';

class App extends Component {
  state = {
    data: "\u003cdiv xmlns:dd=\"DynamicDocumentation\" class=\"ddgrouper ddremovable\" dd:btnfloatingstyle=\"top-right\" id=\"_77609141-8989-47c9-93b6-b048eeb5db42\"\u003e\n\u003cspan style=\"text-decoration: underline;\"\u003eOngoing\u003c/span\u003e\u003cdiv class=\"ddemrcontentitem\" style=\"margin-left: 1em; padding-left: 1em; text-indent: -1em;\" dd:entityid=\"\" dd:contenttype=\"PROBLEMS\" id=\"_f0265850-7afb-4227-bcf7-1183cd273e2e\"\u003eNo chronic problems\u003c/div\u003e\n\u003c/div\u003e\n\u003cdiv xmlns:dd=\"DynamicDocumentation\" class=\"ddgrouper ddremovable\" dd:btnfloatingstyle=\"top-right\" id=\"_b5db751f-7ab0-498f-be01-707c2eb7de2d\"\u003e\n\u003cspan style=\"text-decoration: underline;\"\u003eHistorical\u003c/span\u003e\u003cdiv style=\"margin-left: 1em; padding-left: 1em; text-indent: -1em;\"\u003eNo qualifying data\u003c/div\u003e\n\u003c/div\u003e\n",
    showEditor: false,
    isDirty: false,
    editorInstance: null
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
    let doc = parser.parseFromString(note.htmlContent, 'text/html');
    const htmlContent = doc.body;
    // debugger;
    // htmlContent.getElementsByClassName('ddfreetext ddremovable')[2].innerHTML = "Feverless cold <br><br>Fracture in left hand<br>"
    debugger;
    // Get all the elements with class - 'demrcontentitem ddremovable'
    const emrContentItems = htmlContent.getElementsByClassName('ddemrcontentitem ddremovable');
    const emrDatas = [];

    if (emrContentItems && emrContentItems.length) {
      const emrContents = [];
      // Filter the elements that or not emr, example Orders
      emrContentItems.forEach((emrContentItem) => {
        // SHould consider emrContentItem.getAttribute('dd:contenttype') === 'DIAGNOSES' instead of emrContentItem.hasAttribute('dd:contenttype')
        // if any other tags apart from emrItems has this attribute and consider hekcing for other emrtypes as weel same as DIAGNOSES        // 
        if(emrContentItem.getAttribute('xmlns:dd') === 'DynamicDocumentation' && emrContentItem.hasAttribute('dd:contenttype')) { 
          emrContents.push(emrContentItem)
        }   
      });
      debugger;
      if (emrContents && emrContents.length) {
        emrContents.forEach(emrContent => {
          const emrObject = { };
          let freeTextElement = '';

          // Get the emr data
          if (emrContent.childNodes && emrContent.childNodes.length && emrContent.childNodes[0].wholeText) {
            emrObject.emrItem = emrContent.childNodes[0].wholeText;
          }
          debugger;
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
            emrObject.freeText = 'NO_FREE_TEXT'
          }
          if (freeTextElement) {
            if (freeTextElement.innerText.trim()) {
              emrObject.freeText = freeTextElement.innerHTML;
            } else {
              emrObject.freeText = 'NO_DATA';
            }
          }
          
          note.data.set(emrObject.emrItem, emrObject.freeText);
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
    const genricFreeText = htmlContent.getElementsByClassName('doc-WorkflowComponent-content doc-DynamicDocument-content')[0]
      .getElementsByClassName('ddfreetext ddremovable');
    const genricFreeTextIndex =  genricFreeText.length - 1;

    if (genricFreeText[genricFreeTextIndex].innerText.trim()) {
      note.data.set('Generic Free Text', genricFreeText[genricFreeTextIndex].innerHTML);
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
  

  compareHtml = () => {

    let currentNote = {
      htmlContent: `<div class="doc-WorkflowComponent-content doc-DynamicDocument-content">
      <div class="ddemrcontent" id="_bfb53c88-05af-4a83-940d-ee85b270f608" dd:contenttype="DXORDERS" dd:referenceuuid="28ADF401-6012-454F-B8DF-CD5503253E54">
          <div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="28495795" dd:contenttype="DIAGNOSES">3.&#160;Eyelid retraction (Axis I diagnosis)
              <div style="margin-left:8px" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right" id="_50fd4602-9979-4fe1-8942-864fb853389b" contenteditable="true" data-nusa-concept-name="assessment plan">&nbsp;T></div>
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
          <div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="0">Orders: 
              <div style="padding-left:8px">
                  <div class="ddemrcontentitem ddremovable" dd:entityid="2171389937" dd:contenttype="MEDICATIONS">captopril, 12 mg, Cap, Buccal, q4-6hr, Start Date/Time: 09/12/18, Future Order, 09/12/18 1:00:00 CDT</div>
                  <div class="ddemrcontentitem ddremovable" dd:entityid="2171389913" dd:contenttype="MEDICATIONS">diflunisal, 250 mg, Oral, 12x/Day, PRN pain, Start Date/Time: 09/11/18 7:47:00 CDT, 09/11/18 7:47:00 CDT</div>
                  <div class="ddemrcontentitem ddremovable" dd:entityid="2171389929" dd:contenttype="MEDICATIONS">lisinopril, 20 mg, Oral, 1-2x/Day, Start Date/Time: 09/12/18 0:00:00 CDT, 09/12/18 0:00:00 CDT</div>
                  <div class="ddemrcontentitem ddremovable" dd:entityid="2171389905" dd:contenttype="MEDICATIONS">methadone, 40 mg, Oral, 16x/Day, PRN pain, Start Date/Time: 09/11/18 7:46:00 CDT, 09/11/18 7:46:00 CDT</div>
              </div>
          </div>
      </div>
      <div id="abf85d7f-7f49-f060-9e37-5e9d06ec5d9c" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right" contenteditable="true">Feverish cold <br><br>Fracture in right hand<br></div>
  </div>`,
      formattedHtmlContent: '',
      data: new Map()
    };
    let futureNote = {
      htmlContent: `<div class="doc-WorkflowComponent-content doc-DynamicDocument-content">
      <div class="ddemrcontent" id="_bfb53c88-05af-4a83-940d-ee85b270f608" dd:contenttype="DXORDERS" dd:referenceuuid="28ADF401-6012-454F-B8DF-CD5503253E54">
          <div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="28495821" dd:contenttype="DIAGNOSES">4.&#160;Pain and other conditions associated with female genital organs and menstrual cycle
            <div style="margin-left:8px" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right">Fracture in right hand</div>  
            <div style="clear:both"><span> &#160;</span></div>
          </div>
          <div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="0">Orders: 
              <div style="padding-left:8px">
                  <div class="ddemrcontentitem ddremovable" dd:entityid="2171389937" dd:contenttype="MEDICATIONS">diphtheria/pertussis,acel/tetanus/polio, 10 mg =, Buccal, 2-4x/Day, Start Date/Time: 09/11/18 8:00:00 CDT</div>
                  <div class="ddemrcontentitem ddremovable" dd:entityid="2171389913" dd:contenttype="MEDICATIONS">acetaminophen, 890 mg, Aerosol, Oral, q4-6hr, Start Date/Time: 09/12/18, Future Order, 09/12/18 1:00:00 CDT</div>
              </div>
          </div>
      </div>
      <div id="4b07f8eb-05f8-ecce-6aa5-259977a3fb62" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right" contenteditable="true">Feverish cold <br><br>Fracture in right hand<br></div>
  </div>`,
    formattedHtmlContent: '',
      data: new Map()
    };
    
    console.log("Before formatting Current Note ", currentNote.htmlContent);
    currentNote.htmlContent = this.formatHtml(currentNote.htmlContent);
    console.log("After formatting Current Note ", currentNote.htmlContent);

    console.log("Before formatting Future Note ", futureNote.htmlContent);
    futureNote.htmlContent = this.formatHtml(futureNote.htmlContent);
    console.log("After formatting Future Note ", futureNote.htmlContent);

    this.getDataMap(currentNote);
    this.getDataMap(futureNote);

    console.log(currentNote);
    console.log(futureNote);

    let stopSwitch = false;
    let emrNotFound = [];
    
    debugger;
    for (let emr of currentNote.data.keys()) {
      if (emr !== 'Generic Free Text' && !futureNote.data.has(emr)) {
        if ( currentNote.data.get(emr) !== 'NO_FREE_TEXT' && currentNote.data.get(emr) !== 'NO_DATA') {
          stopSwitch = true;
          emrNotFound.push(emr); // Could be removed if we are not intrested in the problem that is missing
        }
      }
    }

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
  };

  render() {

    let editor = null;
    if (this.state.showEditor) {
      editor = <div>
          <CKEditor
            type="inline"
            data={this.state.data}
            onChange={(event) => {this.changeHandler(event)}}
            onInit={ editor => {
              // You can store the "editor" and use when it is needed.
              this.setState({
                editorInstance: editor
              });
              console.log( 'Editor is ready to use!', editor );
          } }
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
