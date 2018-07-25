import React, { Component } from 'react';
import { Table} from 'semantic-ui-react';


class AsksRow extends Component{
    render(){
        const {Row, Cell} = Table;
        
        return(
            <Row> 
                <Cell>{this.props.id}</Cell>
                <Cell>{this.props.asks.owner}</Cell>
                <Cell>{this.props.asks.price}</Cell>
                <Cell>{this.props.asks.amount}</Cell>
                <Cell>{this.props.asks.date}</Cell>
            </Row>
        )
    }
}

export default AsksRow;