/*
TODO , normalize all traditional and variants to simplified Chinese
*/
var nanchuan="/CBReader/XML_n/N*/*.xml";//T01n0001_001
var tei=require("ksana-document").tei;
var juanstart=0;
var njuan=0;
var filename2sutrano=function(fn) {
	var m=fn.match(/n(.*?)_/);
	if (m) return m[1];
}

var do_ref=function(text,tag,attributes,status) {
	var target=attributes["target"];
	if (!target)return null	;
	target=target.replace("#PTS.","");
	return [
		{path:["pts"], value:target  }
		,{path:["pts_voff"], value:status.vpos }
	]
}
var do_juan=function(text,tag,attributes,status) {
	if (attributes["unit"]=="juan") {
		return [
			{path:["juan"], value:attributes.n  }
			,{path:["juan_voff"], value: status.vpos }
		]
	}
	return null;
}

var do_mulu=function(text,tag,attributes,status) {
	if (attributes["level"]) {
		//console.log(text,attributes.level);
		return [
			{path:["mulu_depth"], value:attributes.level  }
			,{path:["mulu"], value:text  }
			,{path:["mulu_voff"], value: status.vpos }
		]
	}
	return null;
}

var captureTags={
	"milestone":do_juan,
	"cb:mulu":do_mulu,
	"ref":do_ref
};

var beforebodystart=function(s,status) {
}
var afterbodyend=function(s,status) {
	//status has parsed body text and raw body text, raw start text
	var apps=tei(status.starttext+s,status.parsed,status.filename,config,status);
	//console.log(apps)
}
var warning=function() {
	console.log.apply(console,arguments);
}

var onFile=function(fn) {
	process.stdout.write("indexing "+fn+"\033[0G");
}
var setupHandlers=function() {
	this.addHandler("cb:div/p/note", require("./note"));
//	this.addHandler("cb:div/p/app", require("./apparatus"));
	this.addHandler("cb:div/p/choice", require("./choice"));
//	this.addHandler("cb:div/p/cb:tt", require("./cbtt"));
}
var finalized=function(session) {
	console.log("VPOS",session.vpos);
	console.log("FINISHED");
}
var finalizeField=function(fields) {

}
var beforeParseTag=function(xml) {
	//make <back> as root node
	var back=xml.indexOf("<back>");
	xml=xml.substr(back);
	xml=xml.replace("</text></TEI>","");
	return xml;
}
var config={
	name:"nanchuan"
	,meta:{
		config:"simple1"	
	}
	,glob:nanchuan
	,pageSeparator:"pb.n"
	,format:"TEI-P5"
	,bodystart: "<body>"
	,bodyend : "</body>"
	,reset:true
	,setupHandlers:setupHandlers
	,finalized:finalized
	,finalizeField:finalizeField
	,warning:warning
	,captureTags:captureTags
	,callbacks: {
		beforebodystart:beforebodystart
		,afterbodyend:afterbodyend
		,onFile:onFile
		,beforeParseTag:beforeParseTag
	}
}
setTimeout(function(){ //this might load by gulpfile-app.js
	if (!config.gulp) {
		var kd=require("ksana-document");
		if (kd && kd.build) kd.build();
	}
},100)
module.exports=config;