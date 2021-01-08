const app = require('express')()
const fs = require('fs')
const bodyParser= require('body-parser')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded())

//word unscrambler functions

function returnPossibilities(word){
    //This returns all character combinations of a word of a given length, but only in that length.
    function findArrayCombos(word){
        let combinations=[]
        function iterateOnce(word){
            for(let j in word){
                for(let i in word){
                    let str = word.split("")
                    let swap = str[j]
                    str[j] = str[i]
                    str[i]=swap
                    let newStr = str.join("")
                    if(!combinations.includes(newStr)){
                        combinations.push(newStr)
                    }
                }
            } 
        }
        iterateOnce(word)
        console.log(combinations.length)
        for(let i=0;i<combinations.length;i++){
            iterateOnce(combinations[i])
        }
        return combinations
    }

    //This returns all possible slices/trees of a word. I.e., "Banana" -> Banan, Banaa, Bnana, Bana, etc.
    function possibileTrees(str){
        let possibilities=[]

        function recursive(str){
                for(let i=0;i<=str.length;i++){
                    let sliced = str.slice(0,str.length-i) + str.slice((str.length-i+1), str.length)
                    if(!possibilities.includes(sliced)&&sliced) possibilities.push(sliced)
                }
        }
        recursive(str)
        //This is recursive because it continuously increases the length of the possibilities each
        //time the function is run, until it reaches the end.
        for(let i=0;i<possibilities.length;i++){
            recursive(possibilities[i])
        }
        return possibilities
    }

    let trees = possibileTrees(word)
    let words =[]
    trees.forEach(tree=>{
        words.push(findArrayCombos(tree))
    })
    return words
}
    
function parseDictionary(jumbledWords,dict){
    //jumbledWords is an array of arrays, with each array having all
    //combinations of words of a given length, progressively getting smaller
    let validWords=[]
    jumbledWords.flat().forEach(jumbledWord=>{
        if(dict.hasOwnProperty(jumbledWord)){
            validWords.push(jumbledWord)
        }
    })
    return validWords
}


let rawdata = fs.readFileSync('dictionary.json');
const dictionary = JSON.parse(rawdata);

app.get('/',(req,res)=>{
  res.set("Content-Type","text/html")
  res.send(Buffer.from(`
  <style>
  h1{
    text-align:center;
  }
  body{
    padding:2rem;
  }
  p{
    min-width:300px;
    width:50%;
    margin:auto;
  }
  </style>
  <title>Word Unscrambler API</title>
  <body>
     <h1>Word Unscrambler API</h1>
  <p><em>Algorithms and API by Josiah Sprankle</em></p>
  <br>
  
  <p>
  <a href="https://github.com/jspranklemusic/WordUnscramblerAPI">Github Page</a><br><br>
    This is an API to unscramble words, return all possibilities and substrings of a string, and search words in a dictionary. I did not author the "Webster's Unabridged English Dictionary" portion, but the algorithms to parse the dictionary and return results in JSON format. To use this API, the routes are:
<br><br>
/dictionary/yourword --- (returns the definitions)
<br><br>
/trees/yourword --- (returns every single possible combination, substring, and slice of your word in every possible order.... this is a very expensive algorithm, so I have limited the usage to 7 characters.)
<br><br>
/unscramble/yourword --- (this runs the possibilities against the dictionary and returns the results)
<br><br>
NOTE: I found some weird definitions in this dictionary that aren't really usuable in a scrabble game, and this dictionary also does not do plurals, word mutations, or most slang.
<br><br>
Otherwise, everything works as expected. Enjoy!
    </p>
  </body>
 
  `))
})

app.get('/unscramble/:word',(req,res)=>{
    if(req.params.word.length>7){
        return res.json("Whoops! Your word has to be 7 letters max.")
    }
    const possibilities =  returnPossibilities(req.params.word)
    res.json(parseDictionary(possibilities,dictionary))
})

app.get('/trees/:word',(req,res)=>{
    if(req.params.word.length>7){
        return res.json("Whoops! Your word has to be 7 letters max.")
    }
    res.json(returnPossibilities(req.params.word))
    
})

app.get('/dictionary/:word', async (req,res)=>{
    let result = dictionary[req.params.word]
    if(result){
        let regex = /\d\.\s/g
        let matches = result.match(regex)
        if(matches){
            matches.forEach(match=>{
                result = result.replace(match, "\n\n"+match)
            })
        }
        
        res.set('Content-Type', 'text/html');
        res.send(Buffer.from(`
        <style>
            h2{
                text-align:center;
            }
            p{
                width:50%;
                min-width:200px;
                margin:auto;
                white-space:pre-line;
            }
        </style>
        <h2>${req.params.word}:</h2>
        <p>${result}</p>
        
        `));
        
    }else{
        res.send("Hmmm... I can't find that word!")
    }
})

app.listen(3000,()=>{
    console.log('listening on port 3000')
})

