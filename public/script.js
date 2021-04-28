const app = Vue.createApp({
  data(){
    return{
      title:"Word Unscrambler",
      placeholder:"Your word here",
      results:[],
      input:"",
      fetching:false,
    }
  },
  methods:{
    async fetchUnscramble(){
      this.results = [];
      if(this.input.length < 1) return;
      if(this.input.length > 7){
        return this.results = ["Whoops! Your word must be 7 letters max."]
      }
      this.fetching = true;
      const response = await fetch('/unscramble/'+this.input.toLowerCase().trim());
      this.results = await response.json();
      this.fetching = false;
    }
  }
})

app.mount('#app');