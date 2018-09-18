import React, { Component } from 'react';
import csvFile from './data.csv'
import Papa from 'papaparse'
import Countries from './Countries'
import Lodash from 'lodash'
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import './App.css';


class App extends Component {

    constructor(){
        super();
        this.state = {
            currentGraph: "",
            allData: [],
            allValidCountries: [],
            currentDataToGraph: [],
        };
        this.buttonGraphAgesByCountries_click = this.buttonGraphAgesByCountries_click.bind(this);
        this.buttonGraphCountriesByGhostFollowersPercentage_click = this.buttonGraphCountriesByGhostFollowersPercentage_click.bind(this);
        this.buttonGraphAgesByGhostFollowersPercentage_click = this.buttonGraphAgesByGhostFollowersPercentage_click.bind(this);
        this.getGraph = this.getGraph.bind(this);
    }

    componentDidMount() {

        document.get
        Papa.parse(csvFile, {
            header: true,
            download: true,
            skipEmptyLines: true,

            complete: (results) => {
                    this.state.allData = this.removeInvalidCountriesName(results.data)
            }
        })
    }

    removeInvalidCountriesName(dataToCheckInvalidCountries){
        let allValidCountries = [];
        let arrayWithValidCountries = Lodash.map(dataToCheckInvalidCountries, (specificObj)=> {
            specificObj.Country = specificObj.Country.replace(/[^\sa-z-A-Z]+/g,"").trim();
            specificObj.Country = specificObj.Country.charAt(0).toUpperCase() + specificObj.Country.slice(1);
            if((Lodash.find(Countries.countryList, (country) => { return country.name === specificObj.Country || country.code === specificObj.Country}))){
                if (Lodash.indexOf(allValidCountries, specificObj.Country) === -1) {
                    allValidCountries.push(specificObj.Country);
                }
                return (specificObj)
            }
            else {
                return {}
            }
        });
        this.state.allValidCountries = allValidCountries;
        return(arrayWithValidCountries);
    }

    getGraph(){
            if(this.state.currentGraph === "Ages") {
                const AgeRange = ["0-19","20-39","40-59","60-79","80+"];
                return(this.getBarChartGraph(AgeRange));
            }
            else if (this.state.currentGraph === "Countries"){
                return(this.getBarChartGraph(this.state.allValidCountries));
            }
            else {
                return(<BarChart width={1200} height={350}/>);
            }
    }

    getBarChartGraph(dataOfKeys){
        let index =0;
        return (
            <BarChart width={1200} height={350} data={this.state.currentDataToGraph}
                      margin={{top: 80, right: 10, left: 150}} >
                <CartesianGrid strokeDasharray="5 5"/>
                <XAxis dataKey="name" tick={{ fill: 'white' }}/>
                <YAxis tick={{ fill: 'white' }}/>
                <Tooltip/>
                <Legend id='legend' className={'test'} />
                {dataOfKeys.map((key) => {
                    return (
                        <Bar key={index++} dataKey={key} fill={this.generateColor()} />
                    )
                })}
            </BarChart>
        );
    }

    buttonGraphAgesByCountries_click(){
        this.setState({
            currentGraph: "Ages",
            currentDataToGraph: this.getDataToGraphAgesByCountries()
        })
    }

    getDataToGraphAgesByCountries() {

        let arrayOfagesByCountry = this.state.allData.reduce((acc, obj) => {
            if(!Lodash.isEmpty(obj)) {
                if (obj.Country in acc) {
                    acc[obj.Country].push(obj.Age);
                }
                else {
                    acc[obj.Country] = [obj.Age];
                }
            }
            return acc;
        }, {});

        return (this.createObjSortedAgeToGroups(arrayOfagesByCountry));
    }


    createObjSortedAgeToGroups(objToSortByGroupAge){

        let groupsAgeObj = {};
        Lodash.forEach(objToSortByGroupAge, (value,key)=> {
            Lodash.merge(groupsAgeObj,{[key] : {"0-19" : 0 ,"20-39": 0, "40-59": 0, "60-79": 0, "80+": 0}});
        });

        Lodash.forEach(objToSortByGroupAge, (value,key) => {
            if(!Lodash.isEmpty(value)) {
                Lodash.forEach(value, (age) => {
                    let num = Math.trunc(age / 20 < 5 ? age / 20 : 4);
                    groupsAgeObj[key][(Lodash.keys(groupsAgeObj[key])[num])]++;
                })
            }
        });

        let data = [];
        Lodash.forEach(groupsAgeObj,(value,key)=>{
            data.push({name: key, "0-19": value["0-19"], "20-39": value["20-39"], "40-59": value["40-59"] ,"60-79": value["60-79"], "80+":value["80+"]});
        });

        return data;
    }


    buttonGraphCountriesByGhostFollowersPercentage_click(){
        this.setState({
            currentGraph: "Countries",
            currentDataToGraph: this.getDataToGraphDistributionByGhostFollowersPercentage('Country')
        })
    }

    getDataToGraphDistributionByGhostFollowersPercentage(filter) {

        let numOfPercentage;

        let filterByGhostFollowersPercentage = this.state.allData.reduce((acc, obj) => {
            if (!Lodash.isEmpty(obj)) {
                numOfPercentage = this.roundToUpperNearestMultipleOfTen(obj.GhostFollowersPercentage);
                if (numOfPercentage !== undefined) {
                    if (numOfPercentage in acc) {
                        acc[numOfPercentage].push(obj[filter]);
                    }
                    else {
                        acc[numOfPercentage] = [obj[filter]];
                    }
                }
            }
            return acc;
        }, {});

        this.addMissingPercentages(filterByGhostFollowersPercentage);

        if (filter === 'Country') {
            return (this.createObjOfPercentagesByCountingCountries(filterByGhostFollowersPercentage));
        }
        else {
            return (this.createObjSortedAgeToGroups(filterByGhostFollowersPercentage));
        }
    }

    addMissingPercentages(objectToCheckAndAddMissingPercentage) {
        let numOfPercentage;
        for (let i = 0; i <= 10; i++) {
            numOfPercentage = i * 10;
            if (!(numOfPercentage in objectToCheckAndAddMissingPercentage)) {
                objectToCheckAndAddMissingPercentage[numOfPercentage] = [];
            }
        }
    }

    createObjOfPercentagesByCountingCountries(listCountriesByGhostFollowersPercentage){

        let groupsPercentages = [];
        let objOfPercentages =[];
        let currentObject = [];

        console.log(listCountriesByGhostFollowersPercentage);
        objOfPercentages = this.state.allValidCountries.map((country)=>{
            return ([[country] , 0]);
        });


        Lodash.forEach(listCountriesByGhostFollowersPercentage,(value,key)=>{
            key = ["name",`${key}%`];
            console.log(key);
            currentObject = [key].concat(objOfPercentages);
            currentObject = Lodash.assign(...currentObject.map( ([k, v]) => ({[k]: v})));
            groupsPercentages.push(currentObject);
        });

        Lodash.forEach(listCountriesByGhostFollowersPercentage, (value,key) => {
            Lodash.forEach(value, (country)=>{
                (groupsPercentages[(key/10)][country])++;
            })
        });

        return groupsPercentages;
    }

    roundToUpperNearestMultipleOfTen(num){

        let resNumOfPercentage;
        let regex=/^(\d*\.)?\d+$/igm;

        if(Lodash.isEmpty(num)) {
            resNumOfPercentage = 0;
        }
        else if (!(num.match(regex))){
            resNumOfPercentage = undefined
        }
        else if ((num % 10) === 0)
            resNumOfPercentage = num;
        else{
            resNumOfPercentage = Math.ceil(num);
            resNumOfPercentage = (Math.trunc(num/10) + 1 ) * 10;
        }

        return resNumOfPercentage;
    }

    generateColor () {
        return '#' +  Math.random().toString(16).substr(-6);
    }

    buttonGraphAgesByGhostFollowersPercentage_click(){
        this.setState({
            currentGraph: "Ages",
            currentDataToGraph: this.getDataToGraphDistributionByGhostFollowersPercentage('Age')
        })
    }

  render() {
    return (
      <div className="App">
          <body className="App-body">
          <h2 className="App-title">Select Your Graph</h2>
          {this.getGraph()}
          <button className="App-button" onClick={this.buttonGraphAgesByCountries_click}>Ages By Countries</button>
          <button className="App-button" onClick={this.buttonGraphCountriesByGhostFollowersPercentage_click}>Countries By Ghost Followers Percentage</button>
          <button className="App-button" onClick={this.buttonGraphAgesByGhostFollowersPercentage_click}>Ages By Ghost Followers Percentage</button>
          </body>
      </div>
    );
  }
}

export default App;
