import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import React from 'react'
const ACTIONS = {
    ADD_TO_DO: "add",
    REMOVE_TO_DO: "remove"
}
type todo = {
    id: String,
    content: String,
    finish: boolean,
}

function createNewTodo(content:String, finish: boolean):todo{
    return {id: (new Date()).toISOString().toLocaleString(), content: content, finish: finish};
}
function reducer (state:todo[], action:any){
    switch (action.type){
        case ACTIONS.ADD_TO_DO:
            return [...state, createNewTodo(action.payload.content, action.payload.finish)]
        case ACTIONS.REMOVE_TO_DO:
            return [...(state.filter((t) => t.content != action.payload.content))]
        default:
            return state
    }
}
function ToDo(){
    const [state, dispatch] = React.useReducer(reducer, [
            {
                id: (new Date()).toISOString(),
                content: "Implement RESTful API",
                finish: false
            }
        ]
    )
    const [name, setName] = React.useState("");
    function handleSubmit(e:any){
        e.preventDefault();
        dispatch({type: ACTIONS.ADD_TO_DO, payload: {content: name, finish:false}})

        setName("")
    }

    return (
        <main>
            <form onSubmit={handleSubmit}>
                <Input type='text' onChange={(e) => setName(e.target.value)} value={name}></Input>
                <Button type='submit'>Add</Button>
            </form>
            <ul>
                {state.map((state) => (
                    <li>{`${state.id} ${state.content} ${state.finish ? "Finished" : "Unfinished"} `}</li>
                ))}
            </ul>
        </main>
    )   
}

export default ToDo