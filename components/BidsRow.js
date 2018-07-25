import React, { Component } from 'react';
import { Form, Table, Button} from 'semantic-ui-react';

class BidsRow extends Component{
    render(){
        const {Row, Cell} = Table;
        
        return(
            <Row> 
                <Cell>{this.props.id}</Cell>
                <Cell>{this.props.bids.owner}</Cell>
                <Cell>{this.props.bids.price}</Cell>
                <Cell>{this.props.bids.amount}</Cell>
                <Cell>{this.props.bids.date}</Cell>
            </Row>
        )
    }
}

export default BidsRow;