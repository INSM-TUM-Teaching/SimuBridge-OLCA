import React, { useEffect, useState } from 'react'
import BpmnView from './BpmnView'

function BpmnViewSelector(props) {
    const [bpmnViews, setViews] = useState(<></>)



    useEffect(() => {
        console.log(props.currentBpmn)
        setViews(props.bpmns.map((x) => <BpmnView currentBpmn={x} setObject={props.setObject} />))
     
    },[props.bpmns, props.setObject, props.currentBpmn])

  return (
        <>
          {
            bpmnViews[props.currentBpmn]
          }
        </>
  )
}

export default BpmnViewSelector;
  