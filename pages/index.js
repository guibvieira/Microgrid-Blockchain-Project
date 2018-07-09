import React, { Component } from 'react';
import {Card, Button} from 'semantic-ui-react';
import factory from '../ethereum/factory';


//functional component
// export default () => {
//     return (
//         <h1>This is the microgrid list page!!</h1>
//     );
// };

class Household extends Component{
    static async getInitialProps() {
        const households = await factory.methods.getDeployedHouseholds().call();

        return { households : households};
    }      

    renderHouseholds(){
        const items = this.props.households.map(address => {
            return{
                header: address,
                description: (<a>View Household</a>),
                fluid:true
            };
        });

        return <Card.Group items={items} />;
    }

    render() {
        return(
            <div>

                <h3>Open Households</h3>

                {this.renderHouseholds()}
            </div>
        )
    }
}

export default Household;