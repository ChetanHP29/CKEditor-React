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

    stringToHTML = (htmlString) => {
      let parser = new DOMParser();
      let doc = parser.parseFromString(htmlString, 'text/html');
      return doc.body;
    };
  
    getEmrContents = (emrContentItems) => {
      debugger;
      return emrContentItems.filter((emrContentItem) => {
          // Should consider emrContentItem.getAttribute('dd:contenttype') === 'DIAGNOSES' instead of emrContentItem.hasAttribute('dd:contenttype')
          // if any other tags apart from emrItems has this attribute and consider hekcing for other emrtypes as weel same as DIAGNOSES
          return emrContentItem.getAttribute('xmlns:dd') === 'DynamicDocumentation' && emrContentItem.hasAttribute('dd:contenttype');
        });
    };
  
    // getGenericFreeTextElement = (htmlContent) => {
    //   // $$$$$ This works fine if we get this under root div, is there a chance it go under some other element???
    //   let genricFreeTextElement = null;
    //   htmlContent.getElementsByClassName('doc-WorkflowComponent-content doc-DynamicDocument-content')[0]
    //     .getElementsByClassName('ddfreetext ddremovable').forEach(freeTextElement => {
    //       if (freeTextElement.parentElement.getAttribute('class') === "doc-WorkflowComponent-content doc-DynamicDocument-content" ) {
    //         genricFreeTextElement = freeTextElement;
    //       } 
    //     });
    //   return genricFreeTextElement;
    // };
  
    getGenericFreeTextElement = (htmlContent) => {
      // $$$$$ This works fine if we get this under root div, is there a chance it go under some other element???
      let genricFreeText = {};
      htmlContent.getElementsByClassName('doc-WorkflowComponent-content doc-DynamicDocument-content')[0].children.forEach((freeTextElement, index) => {
          if (freeTextElement.getAttribute('class') === "ddfreetext ddremovable") {
              genricFreeText.element = freeTextElement
              genricFreeText.index = index;
          } 
        });
      return genricFreeText;
    };
  
    getEmrFromTemplate = (note) => {
      const htmlContent = this.stringToHTML(note.htmlContent);
      
      // Get all the EMR elements, i.e., elements that has the class name - 'ddemrcontentitem ddremovable'
      const emrContentItems = Array.from(htmlContent.getElementsByClassName('ddemrcontentitem ddremovable'));
  
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
            
            debugger;
            // Find the free text box under emr
            if (emrContent.length) {
              debugger;
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
      debugger;
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
  

  compareHtml = () => {

    let currentTemplate = {
      htmlContent: `<div class="doc-WorkflowComponent-content doc-DynamicDocument-content">
      <div class="ddemrcontent" id="_bfb53c88-05af-4a83-940d-ee85b270f608" dd:contenttype="DXORDERS" dd:referenceuuid="28ADF401-6012-454F-B8DF-CD5503253E54">
          <div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="28495795" dd:contenttype="DIAGNOSES">3.&#160;Eyelid retraction (Axis I diagnosis)
              <div style="margin-left:8px" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right">Fracture</div>
              <div>
                  <div style="display:table-cell;*float:left;padding-left:8px;padding-right:10px">Ordered: </div>
                  <div style="display:table-cell;*float:left">
                      <div class="ddemrcontentitem ddremovable" dd:entityid="2171389921" dd:contenttype="MEDICATIONS">diphtheria/pertussis,acel/tetanus/polio, 10 mg =, Buccal, 2-4x/Day, Start Date/Time: 09/11/18 8:00:00 CDT</div>
                  </div>
              </div>
              <div style="clear:both"><span> &#160;</span></div>
          </div>
          <div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="28495821" dd:contenttype="DIAGNOSES">4.&#160;Pain and other conditions associated with female genital organs and menstrual cycle
              <div style="margin-left:8px" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right">&nbsp;</div>
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
      <div id="abf85d7f-7f49-f060-9e37-5e9d06ec5d9c" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right" contenteditable="true">&nbsp;</div>
  </div>`,
      emrData: new Map()
    };
    let futureTemplate = {
      htmlContent: `<div class="doc-WorkflowComponent-content doc-DynamicDocument-content">
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
    </div>`,
      emrData: new Map()
    };
    
    console.log("Before formatting Current Note ", currentTemplate.htmlContent);
    currentTemplate.htmlContent = this.formatHtml(currentTemplate.htmlContent);
    console.log("After formatting Current Note ", currentTemplate.htmlContent);

    console.log("Before formatting Future Note ", futureTemplate.htmlContent);
    futureTemplate.htmlContent = this.formatHtml(futureTemplate.htmlContent);
    console.log("After formatting Future Note ", futureTemplate.htmlContent);

    this.getEmrFromTemplate(currentTemplate);
    this.getEmrFromTemplate(futureTemplate);
    debugger;
    const testHtml = this.stringToHTML(`<div class="doc-WorkflowComponent-content doc-DynamicDocument-content">
    <div class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right" contenteditable="true" id="_682f6fbd-f626-4b7a-b8ae-e665e933be46" contentEditable="true">Pain associated with micturition<br /><br />Feverish cold<br /><br />Testing Save dd:templateID dd:templateName</div>
    <div class="ddemrcontent" id="_bfb53c88-05af-4a83-940d-ee85b270f608" dd:contenttype="DXORDERS" dd:referenceuuid="28ADF401-6012-454F-B8DF-CD5503253E54" dd:templateid="789" dd:templatename="A&amp;P Inpatient - Orders Grouped"><div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="2105554153" dd:contenttype="DIAGNOSES" id="_5d541ab5-1b24-4052-9041-ebc337e92569">Chronic fever
   <div style="margin-left:8px" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right" contenteditable="true" id="_ee8f49ed-2573-45ac-92bb-01148eb2a756" contentEditable="true"> Temperature of 102, with no other symptoms</div>
   <div style="clear:both"></div>
</div>
<div xmlns:dd="DynamicDocumentation" class="ddemrcontentitem ddremovable" style="clear:both" dd:entityid="2080117899" dd:contenttype="DIAGNOSES" id="_fa4090b8-7279-46a4-9181-1a82c67f83ae">Gas (Complaint of)
   <div style="margin-left:8px" class="ddfreetext ddremovable" dd:btnfloatingstyle="top-right" contenteditable="true" id="_232a7384-8456-4e09-8d27-2105f1eab86b" contentEditable="true">Burning Throt   </div>
   <div style="clear:both"></div>
</div></div>
  

</div>`)
    // console.log(testHtml);
    // let templateID = null;
    // let templateName = null;
    // testHtml.getElementsByClassName('doc-WorkflowComponent-content doc-DynamicDocument-content')[0].children.forEach(htmlElement => {
    //   if(htmlElement.getAttribute('dd:templateid')) {
    //     templateID = htmlElement.getAttribute('dd:templateid');
    //   }

    //   if(htmlElement.getAttribute('dd:templatename')) {
    //     templateName = htmlElement.getAttribute('dd:templatename');
    //   }
    // });

    

    let stopSwitch = false;
    let shouldCompare = false;

    for (let emrData of currentTemplate.emrData.values()) {
      if (emrData.freeTextData !== 'NO_FREE_TEXT' && emrData.freeTextData !== 'NO_DATA') {
        shouldCompare = true;
        // can i return out of loop as soon as i find some data
      }
    }

    debugger;
    if (shouldCompare) {
      let upadatedFutureHtml = this.stringToHTML(futureTemplate.htmlContent);

      const emrContentItems = Array.from(upadatedFutureHtml.getElementsByClassName('ddemrcontentitem ddremovable'));
      
      const emrContents = this.getEmrContents(emrContentItems);

      for (let emr of currentTemplate.emrData.keys()) {
        if (emr !== 'Generic Free Text' && futureTemplate.emrData.has(emr) ){
          if ( currentTemplate.emrData.get(emr).freeTextData !== 'NO_FREE_TEXT' && currentTemplate.emrData.get(emr).freeTextData !== 'NO_DATA') {
            // If EMR doesn't have free text box, forward current template's free text outerHtml
            if (futureTemplate.emrData.get(emr).freeTextData === 'NO_FREE_TEXT') {
              emrContents.forEach(emrContent => {
                  if (emrContent.childNodes[0].wholeText.trim() === emr.trim()) {
                    let htmlContent = this.stringToHTML(currentTemplate.emrData.get(emr).freeTextOuterHTML);
                    emrContent.insertBefore(htmlContent.getElementsByTagName('div')[0], emrContent.firstElementChild);
                  }
                });
            } else { // If EMR has a free text box, forward current template's free text innerHtml
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
          debugger;
            if (futureTemplate.emrData.get(emr).freeTextData === 'NO_FREE_TEXT') {
              // Where should i add place it
              // is this only be at either beginning or end or could be placed anywhere as well.?
              if (currentTemplate.emrData.get(emr).freeTextIndex === 0) {
                // place at beginning
                console.log(upadatedFutureHtml);
                const htmlContent = this.stringToHTML(currentTemplate.emrData.get(emr).freeTextOuterHTML);
                const parentDiv = upadatedFutureHtml.getElementsByClassName('doc-WorkflowComponent-content doc-DynamicDocument-content')[0]
                parentDiv.insertBefore(htmlContent.getElementsByTagName('div')[0], parentDiv.firstElementChild);
                console.log(upadatedFutureHtml);
              } else {
                // place at the end
                console.log(upadatedFutureHtml);
                const htmlContent = this.stringToHTML(currentTemplate.emrData.get(emr).freeTextOuterHTML);
                const parentDiv = upadatedFutureHtml.getElementsByClassName('doc-WorkflowComponent-content doc-DynamicDocument-content')[0]
                parentDiv.insertBefore(htmlContent.getElementsByTagName('div')[0], null);
                console.log(upadatedFutureHtml);
              }
            } else {
              const genricFreeText = this.getGenericFreeTextElement(upadatedFutureHtml);
              genricFreeText.element.innerHTML = currentTemplate.emrData.get(emr).freeTextInnerHTML;
            }
        } 
      }

      // Converting DOM to string and removing the <body> tag added by XMLSerializer
      let oSerializer = new XMLSerializer();
      upadatedFutureHtml = oSerializer.serializeToString(upadatedFutureHtml)
        .replace(/<body[^>]+\?>/i, '').replace(/<\/body>/i, '').replace(/<[//]{0,1}(BODY|body)[^><]*>/g, "");

      if (stopSwitch) {
        alert('DATALOSS');
        // this.showNotificationDialog({
        //   header: "Warning",
        //   title: 'Data Loss',
        //   startMessage: 'You selected a template that does not include the same sections as your current template. Changes will be lost if you switch templates. How do you want to proceed?',
        //   acceptText: 'Discard Changes',
        //   acceptHandler: () => {
        //     this.setState({
        //       notificationDialog: null,
        //       //$$$$
        //       resetUndoRedo: true,
        //       seletedTemplate: selectedTemplateID,
        //       myHtmlContent: upadatedFutureHtml
        //     });
        //   },
        //   rejectText: 'Cancel',
        //   rejectHandler: () => {
        //     this.setState({
        //       //$$$$
        //       notificationDialog: null
        //     })
        //   }
        // });
      } else {
        alert('SWITCHING TEMPLATE');
        // this.setState({
        //   // $$$$$
        //   resetUndoRedo: true,
        //   seletedTemplate: selectedTemplateID,
        //   myHtmlContent: upadatedFutureHtml
        // });
      }
    } else {
      alert('SWITCHING TEMPLATE');
      // this.setState({
      //   // $$$$$
      //   resetUndoRedo: true,
      //   seletedTemplate: selectedTemplateID,
      //   myHtmlContent: futureTemplate.htmlContent
      // });
    }
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


async loadTemplateList() {
    try {
      //const response = APMock.refTemplates; // TODO remove this line of mock data
       const response = await this.context.fetchWorkflowTemplateList(this.props.conceptCki);
      if (response.length) { //if (response.length) {
        this.setState({
          referenceTemplateList: response, //response
        });
        //CP049527 START
        let templateID = null;
        let templateName = null;
        testHtml.getElementsByClassName('doc-WorkflowComponent-content doc-DynamicDocument-content')[0].children.forEach(htmlElement => {
          if(htmlElement.getAttribute('dd:templateid')) {
            templateID = htmlElement.getAttribute('dd:templateid');
          }

          if(htmlElement.getAttribute('dd:templatename')) {
            templateName = htmlElement.getAttribute('dd:templatename');
          }
        });

        if (templateID) {
          response.refTemplates.forEach(template => {
            
          });
        } 
        
        //CP049527 END
        this.fetchDefaultTemplate()
      }
    } catch (e) {
      this.addErrorMessage((this.props.intl.formatMessage({ id: 'workflow-component.failed-to-load' })).replace('{text}', 'Template'));
    }
  }