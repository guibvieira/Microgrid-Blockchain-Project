import React, { Component } from 'react';
import { Form, Table, Button} from 'semantic-ui-react';

class BidsRow extends Component{
    calcDate(){
        let date =new Date(this.props.bids.date);
        let d = date.toLocaleString();
        return d;
    }
    render(){
        const {Row, Cell} = Table;
        
        return(
            <Row> 
                <Cell>{this.props.id}</Cell>
                <Cell>{this.props.bids.owner}</Cell>
                <Cell>{this.props.bids.price}</Cell>
                <Cell>{this.props.bids.amount}</Cell>
                <Cell>{this.calcDate()}</Cell>
            </Row>
        )
    }
}

export default BidsRow;