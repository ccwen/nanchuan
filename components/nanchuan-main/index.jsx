/** @jsx React.DOM */
/*
   SPEC : 
     檔名過慮功能。
     經號速查功能。
     頁碼速查功能。taisho page, pts page 

     相似句搜尋  , 取出 caret 所在句子， 進行模糊搜尋。( 精確和相似結果)

     前後文搜尋 context 統計 。前後1,2 字。  後面 1,2字。 ( time consuming , need a click)
        先用索引查出 可能頁 ( 濾去控制字元， - 排除 )，再送regular expression ，最後頻次統計。
     
     辭典搜尋。搜尋可能名詞。 先取句子。再從游標處做 prefix search ， 退後n字再找。

     對讀。   

*/   
var require_kdb=[{ 
  filename:"nanchuan.kdb"  , url:"http://ya.ksana.tw/kdb/nanchuan.kdb" , desc:"nanchuan"
}];  
var bootstrap=Require("bootstrap"); 
var Fileinstaller=Require("fileinstaller");
var kde=Require('ksana-document').kde;  // Ksana Database Engine
var kse=Require('ksana-document').kse; // Ksana Search Engine (run at client side)
var Stacktoc=Require("stacktoc");
var Showtext=Require("showtext");
var Swipe=Require("swipe");
var Resultlist=React.createClass({  //should search result
  show:function() {  
    return this.props.res.excerpt.map(function(r,i){ // excerpt is an array 
      if (! r) return null;
      return <div data-vpos={r.hits[0][0]}>
      <a href="#" onClick={this.gotopage} className="sourcepage">{r.pagename}</a>)
      <span className="resultitem" dangerouslySetInnerHTML={{__html:r.text}}></span>
      </div>
    },this);
  },
  gotopage:function(e) {
    var vpos=parseInt(e.target.parentNode.dataset['vpos']);
    this.props.gotopage(vpos);
  },
  render:function() { 
    if (this.props.res) return <div>{this.show()}</div>
    else return <div>Not Found</div>
  } 
});        

var Main = React.createClass({
  componentDidMount:function() {

  }, 
  getInitialState: function() {
    return {res:{excerpt:[]},db:null , msg:"click GO button to search"};
  },
  dosearch:function(e) {
    var start=arguments[2]||0; //event == arguments[0], react_id==arguments[1]
    var t=new Date();
    var tofind=this.refs.tofind.getDOMNode().value;
    if (e) tofind=e.target.innerHTML;
    if (tofind=="GO") tofind=this.refs.tofind.getDOMNode().value;
    this.setState({q:tofind,msg:"Searching"});
    var that=this;
    setTimeout(function(){
      kse.search(that.state.db,tofind,{range:{start:start,maxhit:20}},function(data){ //call search engine
        that.setState({res:data,msg:(new Date()-t)+"ms"});
        //console.log(data) ; // watch the result from search engine
      });
    },0);
  },
  keypress:function(e) {
    if (e.key=="Enter") this.dosearch();
  },
  renderinputs:function() {  // input interface for search
    if (this.state.db) {
      return (    
        //"則為正"  "為正觀" both ok
        <div > 
        <div className="centered inputs"><input size="8" onKeyPress={this.keypress} ref="tofind" defaultValue="正觀"></input>
        <button ref="btnsearch" onClick={this.dosearch}>GO</button>
        <a href="#" onClick={this.dosearch}>正知</a> |
        <a href="#" onClick={this.dosearch}>給孤獨園</a> 
        </div>
        <Resultlist gotopage={this.gotopage} res={this.state.res}/>
        </div>
        )          
    } else {
      return <span>loading database....</span>
    }
  }, 
  genToc:function(texts,depths,voffs) {
    var out=[{depth:0,text:"南傳大藏經"}];
    for (var i=0;i<texts.length;i++) {
      out.push({text:texts[i],depth:depths[i], voff:voffs[i]});
    }

    return out; 
  },     
  showPage:function(f,p,hideResultlist) {
    kse.highlightPage(this.state.db,f,p,{q:this.state.q},function(data){
      this.setState({bodytext:data});
      if (hideResultlist) this.setState({res:{excerpt:[]}});
    });
  },
  gotopage:function(vpos) {
    var res=kse.vpos2filepage(this.state.db,vpos);
    this.showPage(res.file,res.page);
    this.slideText();
  },
  nextpage:function() {
    var page=this.state.bodytext.page+1;
    this.showPage(this.state.bodytext.file,page);
  },
  prevpage:function() {
    var page=this.state.bodytext.page-1;
    if (page<0) page=0;
    this.showPage(this.state.bodytext.file,page);
  },
  setPage:function(newpagename,file) {
    file=file||this.state.bodytext.file;
    var pagenames=this.state.db.getFilePageNames(file);
    var p=pagenames.indexOf(newpagename);
    if (p>-1) this.showPage(file,p);
  },
  filepage2vpos:function() {
    var offsets=this.state.db.getFilePageOffsets(this.state.bodytext.file);
    return offsets[this.state.bodytext.page];
  },
  showText:function(n) {
    var res=kse.vpos2filepage(this.state.db,this.state.toc[n].voff);
    this.showPage(res.file,res.page);
    this.slideText();
  },
  onReady:function(usage,quota) {
    if (!this.state.db) kde.open("nanchuan",function(db){
        this.setState({db:db});
        db.get([["fields","mulu"],["fields","mulu_depth"],
          ["fields","mulu_voff"]],function() {
          var mulus=db.get(["fields","mulu"]);
          var depths=db.get(["fields","mulu_depth"]);
          var voffs=db.get(["fields","mulu_voff"]);
          var toc=this.genToc(mulus,depths,voffs);//,toc:toc
          this.setState({toc:toc});
          //this.goHashTag();
       });
    },this);      
    this.setState({dialog:false,quota:quota,usage:usage});
  },
  openFileinstaller:function(autoclose) {
    if (window.location.origin.indexOf("http://127.0.0.1")==0) {
      require_kdb[0].url=window.location.origin+window.location.pathname+"nanchuan.kdb";
    }
    return <Fileinstaller quota="512M" autoclose={autoclose} needed={require_kdb} 
                     onReady={this.onReady}/>
  },
  fidialog:function() {
      this.setState({dialog:true});
  }, 
  showExcerpt:function(n) {
    var voff=this.state.toc[n].voff;
    this.dosearch(null,null,voff);
    this.slideSearch();
  },
  syncToc:function(voff) {
    this.setState({goVoff:voff||this.filepage2vpos()});
    this.slideToc();
  },
  slideSearch:function() {
    this.refs.Swipe.swipe.slide(2);
  },
  slideToc:function() {
    this.refs.Swipe.swipe.slide(0);
  },
  slideText:function() {
    this.refs.Swipe.swipe.slide(1);
  },
  onSwipeStart:function(target) {
    if (target && this.swipable(target)) {
      this.targetbg=target.style.background;
      target.style.background="yellow";
    }
  },
  swipable:function(target) {
    while (target && target.dataset && 
      typeof target.dataset.n=="undefined" && typeof target.dataset.vpos=="undefined" ) {
      target=target.parentNode;
    }
    if (target && target.dataset) return true;
  },
  tryTocNode:function(index,target){
    while (target && target.dataset && typeof target.dataset.n=="undefined") {
      target=target.parentNode;
    }
    if (target && target.dataset&&target.dataset.n) {
      if (index==2) {//filter search result
        this.showExcerpt(target.dataset.n);
      } else {
        var voff=this.state.toc[target.dataset.n].voff;
        this.gotopage(voff);  
      }    
      return true;
    }
  },
  tryResultItem:function(index,target) {
    while (target && target.dataset && typeof target.dataset.vpos=="undefined") {
      target=target.parentNode;
    }
    if (target && target.dataset&&target.dataset.vpos) {
      var vpos=parseInt(target.dataset.vpos);
      if (index==1) {
        this.gotopage(vpos);
      } else {
       // this.syncToc(vpos);
      }
      return true;
    }
  },
  onSwipeEnd:function(target) {
    if (target && this.targetbg!=null) {
      target.style.background=this.targetbg;
      this.targetbg=null;
    }    
  },
  onTransitionEnd:function(index,slide,target) {
    console.log(index);
    if (!this.tryResultItem(index,target)) this.tryTocNode(index,target);
  },
  renderSlideButtons:function() {
    if (ksana.platform!="ios" && ksana.platform!="android") {
      return <div>
        <button onClick={this.slideToc}>Toc</button>
        <button onClick={this.slideText}>Text</button>
        <button onClick={this.slideSearch}>Search</button>
      </div>
    }
  },
  render: function() {  //main render routine
    if (!this.state.quota) { // install required db
        return this.openFileinstaller(true);
    } else {
      var text="";
      var pagename="";
      if (this.state.bodytext) {
        text=this.state.bodytext.text;
        pagename=this.state.bodytext.pagename;
      }

     return (
      <div className="main">
        {this.renderSlideButtons()}
        <Swipe ref="Swipe" continuous={true} 
               transitionEnd={this.onTransitionEnd} 
               swipeStart={this.onSwipeStart} swipeEnd={this.onSwipeEnd}>
        <div>
          <Stacktoc showText={this.showText}  
            showExcerpt={this.showExcerpt} hits={this.state.res.rawresult} 
            data={this.state.toc} goVoff={this.state.goVoff} 
            showTextOnLeafNodeOnly={true} />
        </div>
        <div>                 
          <Showtext pagename={pagename} text={text} 
             nextpage={this.nextpage} 
             setpage={this.setPage}
             prevpage={this.prevpage} 
             syncToc={this.syncToc}/>
        </div>
        <div>
            {this.renderinputs()} 
        </div>
        </Swipe>
      </div>
    );
  }
  } 
});
module.exports=Main; //common JS
/*

        
        
*/