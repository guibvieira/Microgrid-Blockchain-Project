import React, { Component } from 'react';
import { Card } from 'semantic-ui-react';
import Layout from '../components/Layout';
import HouseholdForm from '../components/HouseholdForm';
import { Link, Router } from '../routes';
import factory from '../ethereum/factory';
import web3 from '../ethereum/web3';


class Household extends Component {
    static async getInitialProps() {
        const households = await factory.methods.getDeployedHouseholds().call();


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
                <h3>Open Households</h3>
                <HouseholdForm class="short"></HouseholdForm>
                {this.renderHouseholds()}
                <Link route={'/test'}>
                    <a>test</a>
                </Link>
            </Layout>
            
        )
    }
}

export default Household;