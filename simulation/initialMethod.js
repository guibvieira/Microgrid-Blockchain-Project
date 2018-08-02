console.log('logging results household 26', metaData);
    //create half the households without any battery Capacity
    for (i=1; i<metaData.length/2; i++){
        console.log(i);
        id = metaData[i][0];
        baseValue = metaData[i][2];
        baseValueBattery = metaData[i][3];
        householdFile = `../data/household_${id}.csv`;
        
        householdHistoricData = await loadData(householdFile);

        //creation of agents and feeding the data in
        agent = new Agent(0); //no battery capacity passed
        agentAccount = await agent.getAccount(i);
        household = await agent.deployContract();
        await agent.loadSmartMeterData(householdHistoricData, baseValue, baseValueBattery);
        agentsNoBattery.push( new Array(id, agent));
    }
    //create half of the households with battery Capacity
    for (i=metaData.length/2; i<metaData.length; i++){
        id = metaData[i][0];
        baseValue = metaData[i][2];
        baseValueBattery = metaData[i][3];
        householdFile = `../data/household_${id}.csv`;
        
        householdVar = await loadData(householdFile);

        //creation of agents and feeding the data in
        agent = new Agent(12000); //tesla powerwall
        agentAccount = await agent.getAccount(i);
        household = await agent.deployContract();
        await agent.loadSmartMeterData(householdHistoricData, baseValue, baseValueBattery);
        agentsBattery.push(new Array(id, agent));

    }

    

    console.log('id', id);
    console.log('householdFile', householdFile);
    console.log('householdVar', householdVar);
    console.log('agents with no Battery', agentsNoBattery);
    console.log('agent with battery', agentsBattery);