import React, { Component } from 'react';
import { Card } from 'semantic-ui-react';
import Layout from '../components/Layout';
import HouseholdForm from '../components/HouseholdForm';
import { Link, Router } from '../routes';
import factory from '../ethereum/factory';
import web3 from '../ethereum/web3';


class HouseholdIndex extends Component {
    static async getInitialProps() {
        
        const households = await factory.methods.getDeployedHouseholds().call();

        console.log(households);

        return { 
            households
        };
    }

    renderHouseholds(){
        console.log('renderHouseholds', this.props);
        const items = this.props.households.map(address => {
            return{
                header: address,
                description: (
                    <Link route='household' params={{address}} >
                        <a>View Household</a>
                    </Link>
                ),
                fluid: true
            };
        });

        return <Card.Group items={items} />;
    }

    

    render() {
        return(
            <Layout>
                <h3>Create Households</h3>
                <HouseholdForm households={this.props.households} class="short"></HouseholdForm>
                <h3>Open Households in Microgrid</h3>
                {this.renderHouseholds()}
            </Layout>
            
        )
    }
}

export default HouseholdIndex;