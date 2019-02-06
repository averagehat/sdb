import logo from './logo.svg';
import './App.css';
import { render } from 'react-dom';
import React, { Component } from 'react';
//import foo from 'data/practice.csv'
//console.log(foo);
var Papa = require('papaparse');


function getFileBlocking(filename) { 
  var xmlhttp = new XMLHttpRequest(); xmlhttp.responseType = "text";
  xmlhttp.responseType = "text"
  xmlhttp.open("GET", filename, true);
  xmlhttp.send();
  return xmlhttp.responseText
}
// TODO: huge datalist made from DB contents? Probably.
var makeOpts = xs => xs.map(x => <option value={x}>{x} </option>);
var makeSelect = (label, f, xs) => {
 return  <select onChange={f} name={label}>
        {makeOpts(xs)} </select>
}
   
var concatMap = (f, xs) => xs.map(f).reduce((a, b) => a.concat(b), []);

class DbEntry {   
    _fields = ["species", "name", "year", "month", "day", "continent", "country", "strain", "type", "subtype", "host"]
 segs = ["HA", "MP", "NA", "NP", "NS", "PA", "PB1", "PB2"]
 segFields = concatMap(s => ["acc" + s, "segment" + s], this.segs)
 fields = this._fields.concat(this.segFields)
    render = (fields, xs) =>
   <table>
	<tr>{fields.map(f => <td>{f}</td>)}</tr>
        {concatMap(x => {
	    var ys = fields.map(f => <td>{x[f] ? x[f] : "n/a"}</td>) 
	    return <tr>{ys}</tr>}, xs)}
   </table>
}
var getFields = species => (species === "flu") ? dbView.fields : dbView._fields;
var dbView = new DbEntry();
var MIN_DATE = new Date(100, 0, 1);
var MAX_DATE = new Date(3005, 0, 1);
var initialState = { value: 0, 
          segment: "any",
          results : [],
          name: "",
	  start_Date: MIN_DATE,
	  end_Date: MAX_DATE,
          country: "",
          host: "",
          serotype: "",
          genotype: "",
          sampleSize: 9000,
          random: false,
          subtype: "",
          infectionNum: "",
          disease: "",
          accession: "",
          species: "flu",
          format: "fasta",
          fields: getFields("flu")}

var db = [{name: "foo", year: 1999, accNA: "accNA!", sequence: "ATCG"}]
//Papa.parse(new File([''], 'data/Denv1HumanMetadata.csv'), {
//Papa.parse(new File([''], 'data/practice.csv'), {
//Papa.parse('file:///Users/mikep/sdb/data/practice.csv', {
Papa.parse('https://gist.githubusercontent.com/averagehat/6290a66270a744aa466d84c0c533740e/raw', {
    delimiter: ',',
    header: true,
    download: true,
    dynamicTyping: true,
    complete: function(results) {
	console.log(results.data);
	    db = db.concat(results.data);
	}
});
//var text = getFileBlocking('./data/practice.csv')
//var text = getFileBlocking('%PUBLIC_URL%/manifest.json')
//../public/manifest.json')
//console.log(text)
//Papa.parse(text, {
//    delimiter: ',',
//    header: true,
//    dynamicTyping: true,
//    complete: function(results) {
//	console.log(results.data);
//	    db.concat(results.data);
//	}
//});

class App extends Component {
  state = initialState  
  segments = ["any", "PB1", "PB2"]

  serotypes = ["H1N1", "H1N2", "DENV1"]
 // TODO: mkSetter should .trim() strings but not ints
 mkSetter = (label) => e => this.setState({[label]: e.target.value.trim()})
 runQuery  = () => {
   var query  = state => x => {
   var  eq = (a, b) => (a === "any") || (!a) || (!b) || (a === b)
       var  dateMatch = (mind, maxd, x) =>
        !x.year 
     || (mind.getFullYear() <= x.year) && (x.year <= maxd.getFullYear())
     && ((!x.month) || (mind.getMonth() <= x.month <= maxd.getMonth()))
     && ((!x.day) || (mind.getDate() <= x.day <= maxd.getDate()))
       
     var simpleFields = ["species", "segment", "name", "country", "host", "serotype"]
     var simpleMatch = simpleFields.every( (f => eq(state[f], x[f])) )
     console.log(simpleMatch);
     var datematch = dateMatch(state.start_Date, state.end_Date, x)
     var accMatch = (state.species !== "flu") || !state.accession || dbView.segFields.map(f => x[f]).some(a => a === state.accession)
     return (simpleMatch && datematch && accMatch)
   }
   
   var result = db.filter(query(this.state))
   return this.setState({results: result})
 }
 
 mkSelect = (label, options) => {
   var f = this.mkSetter(label)
   return <div><label for={label}>{label}</label>
     <select onChange={f} id={label}>
          {makeOpts(options)}
        </select></div>
 }
mkInput = type => (label) => 
  <div>  
   <label for={label}>{label}</label>
	<input type={type} onChange={e => this.setState({[label]: e.target.value})} value={this.state[label]}/>
  <br/>
  </div>

textInput = this.mkInput("text");

dateInput = (label) => {
  var setter = e => {
    var default_ = (label.startsWith("start")) ? MIN_DATE : MAX_DATE
    var date = (e.target.value) ? new Date(e.target.value) : default_
    return this.setState({[label]: date})
    
  }

 return <div>  
   <label for={label}>{label}</label>
	<input type="date" onChange={setter} value={this.state[label]}/>
  <br/>
  </div>
  }
mkDataListInput = (label, opts) => 
 <div>
  <label for={label}>{label}</label>
  <input list={label+"List"} onChange={this.mkSetter(label)} id={label}/>
  <datalist id={label+"List"}> {makeOpts(opts)} </datalist>
 </div>  
 handleToggle = e => { // TODO: swap DB to save memory 
  var species = e.target.checked ? "dengue" : "flu";
  var fields = getFields(species);
  this.setState({species: species, fields: fields});
}

toFasta = (fs, xs) => xs.map(x => "> " +
                            (fs.map(y => x[y]).join(":")) + "\n" + x.sequence).join("\n");

toCsv = (fs, xs) => {
  var sep = ","
  return fs.concat(["sequence"]).join(sep) + "\n" + xs.map(x => fs.map(y => x[y]).join(sep) + sep + x.sequence).join("\n");
}
 download = () => {
   var fields = getFields(this.state.species);
   var content = (this.state.format === "fasta") ? this.toFasta(fields, this.state.results) : this.toCsv(fields, this.state.results);
   var extension = (this.format === "fasta") ? "fa" : "csv"
   var fileName = "results." + extension
   var uriContent = "data:application/octet-stream," + encodeURIComponent(content);
   
var newWindow = window.open(uriContent, fileName);

   
 }
  render() {
    return (
      <div>
        {this.textInput("country")}
        {this.textInput("name")}
        {this.textInput("continent")}
        {this.textInput("accession")}
        
        {this.mkSelect("segment", this.segments)}
        {this.mkSelect("format", ["fasta", "csv"])}
        
        {this.mkDataListInput("serotype", this.serotypes)}
        
        {this.dateInput("start_Date")}
        {this.dateInput("end_Date")}

        <button onClick={this.runQuery}> Search </button>
        <button onClick={() => this.setState(initialState)}> Clear </button>

        <br/>
        
      <label for="switch">{this.state.species}</label>
        <input type="checkbox" data-role="flipswitch" name="switch" id="switch" onChange={this.handleToggle}/> 
        <button onClick={this.download}> Download </button>
        {dbView.render(getFields(this.state.species), this.state.results)}
      </div>

      
    )
  }
}

export default App;
