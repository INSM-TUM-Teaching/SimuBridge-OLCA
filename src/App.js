import {React, useState, useEffect} from 'react';
import './styles/globals.css'
import {
  ChakraProvider,
  Box,
  theme,
  Flex,
  Container
} from '@chakra-ui/react';
import Navigation from './components/Navigation/Navigation';
import Parameditor from './components/Parameditor';
import StartView from './components/StartView';
import BpmnParser from './BpmnParser';
import Page from './components/Page';



function App() {
  const [current, setCurrent] = useState("Scenario Parameters")

  const [projectStarted, setStarted] = useState(sessionStorage.getItem('st') || "false")
  const [bpmns, setBpmns] = useState([{
                                        name: "Warenversand",
                                        file : "https://raw.githubusercontent.com/camunda/bpmn-for-research/master/BPMN%20for%20Research/German/01-Vorbereitung-des-Warenversands/03-Musterl%C3%B6sung/vorbereitung-des-warenversands.bpmn" 
                                      },
                                      {
                                        name: "Schufascoring",
                                        file : "https://raw.githubusercontent.com/camunda/bpmn-for-research/master/BPMN%20for%20Research/German/03-Schufascoring/03-Musterl%C3%B6sung/schufascoring-asynchron.bpmn"
                                      },
                                      {
                                        name: "Selbstbedienung",
                                        file : "https://raw.githubusercontent.com/camunda/bpmn-for-research/master/BPMN%20for%20Research/German/04-Selbstbedienungsrestaurant/03-Musterl%C3%B6sung/selbstbedienungsrestaurant.bpmn"
                                      }])
  const [scenarios, setscenarios] = useState([{
                                        name: "Scenario 1",
                                      },
                                      {
                                        name: "Scenario 2",
                                      }])
                                      
  const [currentBpmn, setBpmn] = useState(0)
  const [currentScenario, setScenario] = useState(0)
  const [currentObject, setObject] = useState({})

  const [data, setData] = useState({})
  

  useEffect(() => {
    sessionStorage.setItem('st', projectStarted);
  }, [projectStarted]);

  useEffect(() => {
    console.log(data)
  }, [data])





  return (
    <ChakraProvider theme={theme}>
      <BpmnParser currentBpmn={currentBpmn} bpmns={bpmns} data={data} setData={setData} />

      <Flex bg="#F9FAFC" h="100vh" zIndex={-3}>
        {projectStarted === "false"?
          <StartView setStarted={setStarted}/>
        :
        <>
          <Box zIndex={2} paddingTop={{base: "0", md:"6"}} >
            <Navigation 
              setCurrent={setCurrent}  
              setStarted={setStarted} 
              current={current} 
              bpmns={bpmns} 
              currentBpmn={currentBpmn} 
              setBpmn={setBpmn} 
              currentScenario={currentScenario}
              setScenario={setScenario}
              scenarios={scenarios}
              />
            <Parameditor data={data} current={current} selectedObject={currentObject}  />
          </Box>

        
          <Container maxW={current === "Modelbased Parameters"? '' : '60vw'}>
            
              <Page current={current} setObject={setObject} currentBpmn={currentBpmn}  bpmns={bpmns} />
            
         </Container>
        
        </>
        }
      </Flex>
    </ChakraProvider>
  );
}

export default App;
