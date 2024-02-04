import React, { useState, useRef, useEffect } from "react";
import {
  Alert, AlertIcon, AlertDescription, CloseButton, useDisclosure,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon,
  Flex,
  Heading,
  Card, CardHeader, CardBody,
  Text,
  Input, InputGroup, InputRightElement, InputLeftElement,
  Select, Button,
  Progress,
  Box,
  Spinner,
  useToast,
  UnorderedList, ListItem
} from '@chakra-ui/react';

import { ExternalLinkIcon } from '@chakra-ui/icons';
import "./styles.css"

import SimulationModelModdle, { assign, limitToDataScheme } from "simulation-bridge-datamodel/DataModel";

const LcaIntegration = ({ getData, toasting }) => {
  //vars
  const defaultApiUrl = 'http://localhost:8081';
  const [apiUrl, setApiUrl] = useState(defaultApiUrl);
  const [isApiUrlValid, setIsApiUrlValid] = useState(true);
  const [isFetchingRunning, setIsFetchingRunning] = useState(false);
  const [isScenarioModelLoaded, setIsScenarioModelLoaded] = useState(true);
  const impactMethodId = 'b4571628-4b7b-3e4f-81b1-9a8cca6cb3f8';
  const [allCostDrivers, setAllCostDrivers] = useState([]);
  const [isCostDriversLoaded, setIsCostDriversLoaded] = useState(false);

  //init
  console.log("Current resource parameters: ", getData().getCurrentScenario().resourceParameters);
  console.log('Scenario Data: ', getData().getCurrentScenario().models[0]);

  useEffect(() => {
    const scenario = getData().getCurrentScenario();

    if (scenario) {
      const costDrivers = scenario.resourceParameters.environmentalCostDrivers;
      const uniqueCostDrivers = Array.from(new Map(costDrivers.map(item => [item.id, item])).values());
      setAllCostDrivers(uniqueCostDrivers);
      setIsCostDriversLoaded(uniqueCostDrivers.length > 0);
    }
  }, []);

  const handleApiUrlChange = (event) => {
    const value = event.target.value;
    setApiUrl(value);
    validateUrl(value);
  };

  const validateUrl = (url) => {
    const regex = /^http:\/\/[\w.]+:\d+$/;
    setIsApiUrlValid(regex.test(url));
  };

  const fillDefaultHostPortButtonClick = () => {
    setApiUrl(defaultApiUrl);
    setIsApiUrlValid(true);
  };

  const processApiResponse = async (response) => {
    var data = response.result;
    console.log('Cost drivers from API:', data);
    var abstractCostDriversMap = new Map();

    data.forEach(el => {
      let unitConfig = SimulationModelModdle.getInstance().create("simulationmodel:TargetUnit", {
        id: el.targetUnit['@id'],
        name: el.targetUnit.name,
      });

      let concreteCostDriverConfig = SimulationModelModdle.getInstance().create("simulationmodel:ConcreteCostDriver", {
        id: el['@id'],
        name: el.name,
        cost: el.targetAmount,
        unit: unitConfig
      });

      if (!abstractCostDriversMap.has(el.category)) {
        let abstractDriver = SimulationModelModdle.getInstance().create("simulationmodel:AbstractCostDriver", {
          id: el.category, // Using category as the unique identifier
          name: el.category,
          concreteCostDrivers: [concreteCostDriverConfig]
        });
        abstractCostDriversMap.set(el.category, abstractDriver);
      } else {
        let abstractDriver = abstractCostDriversMap.get(el.category);
        abstractDriver.concreteCostDrivers.push(concreteCostDriverConfig);
      }
    });

    const abstractCostDrivers = Array.from(abstractCostDriversMap.values());

    getData().getCurrentScenario().resourceParameters.environmentalCostDrivers = abstractCostDrivers;

    console.log('Abstract Cost Drivers:', abstractCostDrivers);
    console.log('Resource Parameters:', getData().getCurrentScenario().resourceParameters);

    await getData().saveCurrentScenario();
    toasting("success", "Success", "Cost drivers were successfully saved to the application");
    setAllCostDrivers(abstractCostDrivers);
    setIsCostDriversLoaded(true);
  };

  const handleButtonClick = async () => {
    if (!isApiUrlValid) {
      toasting("error", "Invalid URL", "Please enter a valid URL in the format 'http://[host]:[port]'");
      return;
    }

    setIsFetchingRunning(true);

    // Make an API call using fetch
    let resp = await fetch(apiUrl, {
      method: "POST",
      timeout: 10000,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "data/get/all",
        params: {
          "@type": "ProductSystem"
        }
      })
    })
      .then((response) => {
        setIsFetchingRunning(false);
        if (!response.ok) {

          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(async (data) => {
        console.log('API Response:', data);
        await processApiResponse(data);
        toasting("success", "Success", "Cost drivers fetched successfully");
        // Handle the response as needed
      })
      .catch((error) => {
        setIsFetchingRunning(false);
        toasting("error", "Error", "Please check if the OpenLCA IPC server is running and the URL is correct");

        console.error('API Error:', error);
        // Handle errors as needed
      });
  };

  const {
    isOpen: isAlertBoxVisible,
    onClose,
    onOpen,
  } = useDisclosure({ defaultIsOpen: true })

  return (
    !isScenarioModelLoaded ?
      <Flex
        height="100vh"
        justifyContent="center"
        alignItems="center"
      >
        <Spinner size='xl' />
      </Flex>
      :
      <Box>
        <Card bg="white" mt="25px">
          <CardHeader>
            <Heading size='md'>Configure OpenLCA integration</Heading>
          </CardHeader>
          <CardBody>
            OpenLCA IPC server host and port:
            <Flex mt={2}>
              <InputGroup size='md'>
                <InputLeftElement pointerEvents='none'>
                  <ExternalLinkIcon color='gray.300' />
                </InputLeftElement>
                <Input
                  size="md"
                  type="url"
                  value={apiUrl}
                  isInvalid={!isApiUrlValid}
                  errorBorderColor='red.300'
                  onChange={handleApiUrlChange}
                  placeholder="e.g., http://localhost:8080"
                />
                <InputRightElement width='4.5rem' mr={2}>
                  <Button h='1.75rem' size='sm'
                    onClick={fillDefaultHostPortButtonClick}>
                    Default
                  </Button>
                </InputRightElement>
              </InputGroup>
              <Button
                onClick={handleButtonClick}
                disabled={isFetchingRunning}
                colorScheme='white'
                variant='outline'
                border='1px'
                borderColor='#B4C7C9'
                color='#6E6E6F'
                _hover={{ bg: '#B4C7C9' }}
                ml={2}
              >
                Fetch
              </Button>
            </Flex>
            {isFetchingRunning && <Progress mt={2} colorScheme='green' size='xs' isIndeterminate />}
          </CardBody>
        </Card>
        
        { !isCostDriversLoaded && isAlertBoxVisible &&
          <Alert status='warning' mt={2} display='flex' alignItems='center' justifyContent='space-between'>
            <Flex alignItems='center'>
                <AlertIcon />
                <AlertDescription>There are no cost drivers saved in the system. Use the window above to fetch.</AlertDescription>
            </Flex>
            <CloseButton position='relative' onClick={onClose} />
        </Alert>
        }
        {isCostDriversLoaded &&
          <Card mt={2}>
            <CardHeader>
              <Heading size='md'>{allCostDrivers.length} abstract cost drivers</Heading>
            </CardHeader>
            <CardBody>
              <Accordion allowToggle>
                {allCostDrivers.map((costDriver, index) => (
                  <AccordionItem key={index}>
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          <Text fontSize="lg" fontWeight="bold">
                            {costDriver.name}
                          </Text>
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <UnorderedList>
                        {costDriver.concreteCostDrivers.map((concreteCostDriver, index) => (
                          <ListItem key={index}>
                            {concreteCostDriver.name}: {concreteCostDriver.cost} {concreteCostDriver.unit.name}
                          </ListItem>
                        ))}
                      </UnorderedList>
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardBody>
          </Card>
        }
      </Box>
  );
};
export default LcaIntegration;
