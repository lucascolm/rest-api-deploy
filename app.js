const express =require ('express');
const movies=require('./movies.json')
const crypto = require('node:crypto');
const cors= require('cors');
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const app = express();
app.use(express.json());
  app.use(cors({
    origin:(origin,callback)=>{
        const ACCEPTED_ORIGINS=[
            'http://localhost:8080',
            'http://localhost:1234'
        ]
        if (ACCEPTED_ORIGINS.includes(origin)) {
            return callback(null, true)
          }
          if (!origin) {
            return callback(null, true)
          }
          return callback(new Error('Not allowed by CORS'))      
    }
  }));
app.disable('x-powered-by');


app.get('/movies', (req, res) => {
    const {genre}=req.query;
    if(genre){
        const filteresMovies=movies.filter(movie=>movie.genre.some(g=>g.toLocaleLowerCase()==genre.toLocaleLowerCase())
        )
        return res.json(filteresMovies);
    }
    res.json(movies) 
});

app.get('/movies/:id', (req, res) => {
    const{id}=req.params; 
    const movie=movies.find(movie=>movie.id==id);
    if(movie) return res.json(movie)
    res.status(404).send({message:'Movie not found'})
})
app.post('/movies', (req, res) => {
    // direcramente le pasamos a la funcion validadora el requesr.body
    // const{title,genre, year, director, duration,rate, poster}=req.body;
    const result=validateMovie(req.body);
    
    if(result.error){
        //se puede usar el error 422
        return res.status(400).json({error:JSON.parse(result.error.message)})
    }
    const newMovie={
        id:crypto.randomUUID(),
        ...result.data
    }
     // Esto no sería REST, porque estamos guardando
    // el estado de la aplicación en memoria
    movies.push(newMovie)
    res.status(201).json(newMovie)
})

app.patch('/movies/:id',(req, res) =>{
    const result=validatePartialMovie(req.body); 
    if(!result.success){
        return res.status(400).json({error:JSON.parse(result.error.message)})
    }

    const {id}=req.params;
    const movieIndex=movies.findIndex(m=>m.id==id);
    if(movieIndex==-1){
        return res.status(404).json({message:'Movie not found'})
    }
   //ACTUALIZAMOS LA PELICULA
   const updatedMovie={
    ...movies[movieIndex],
    ...result.data
   }
   movies[movieIndex]=updatedMovie;
   return res.json(updatedMovie)
   
})
app.delete('/movies/:id',(req, res) =>{
    const {id}=req.params;
    const movieIndex=movies.findIndex(m=>m.id==id);
    if(movieIndex==-1){
        return res.status(404).json({message:'Movie not found'})
    }

    movies.splice(movieIndex,1);
    return res.status(204).json({message:'Movie deleted successfully'})
})

const PORT = process.env.PORT ?? 1234;

app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
})