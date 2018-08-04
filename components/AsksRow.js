import React, { Component } from 'react';
import { Table} from 'semantic-ui-react';


class AsksRow extends Component{
    calcDate(){
        let date = new Date(parseInt(this.props.bids.date));
        date = date.toLocaleString();
        return date;
    }
    render(){
        const {Row, Cell} = Table;
        
        return(
            <Row> 
                <Cell>{this.props.id}</Cell>
                <Cell>{this.props.asks.owner}</Cell>
                <Cell>{this.props.asks.price}</Cell>
                <Cell>{this.props.asks.amount}</Cell>
                <Cell>{this.calcDate()}</Cell>
            </Row>
        )
    }
}

export default AsksRow;