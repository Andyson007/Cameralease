# API docs

## conventions

names in \<\> are variable urls e.g. /api/history/\<id\> would match /api/history/5 and

### Acronyms
- iff: if and only if
- DB: database

## GET

### /api/cams
Returns all cameras with information about them. 

An unordered array populated with objects:

- name: string | The name of the camera
- model: string | The model of the camera
- uid: number | id of the current camera (unique)
- reservations: Array | future reservations of the current camera each of the elements are an object:
    - start: number | The time at which the cameralease will start given in epoch time (seconds)
    - end: number | The time at which the cameralease will end given in epoch time (seconds)
    - user: string | The name of the person who reserved
- starttime number | (Optional exists iff starttime is defined): The time at which this cameras lease was started (Only included if the camera is currently beingn leased)
- user string | (Optional exists iff starttime is defined): The user that is currently inn posession of the camera

### /api/history
Returns all previous leases

An array populated with objects:
- id: number | the id of the current element (unique in /api/history)
- camid: number | the id of the camera that was leased (unique in /api/cams)
- starttime: number | The time at which the cameras lease was started given in epoch time (seconds)
- end: number | The time at which the cameras lease was ended given in epoch time (seconds)
- name: string | The name of the person that is responsible for this entry

### /api/history/\<id\>
Returns the element with the given id

A single object with:
- id: number | the id of the current element (unique in /api/history)
- camid: number | the id of the camera that was leased (unique in /api/cams)
- starttime: number | The time at which the cameras lease was started given in epoch time (seconds)
- end: number | The time at which the cameras lease was ended given in epoch time (seconds)
- name: string | The name of the person that is responsible for this entry

### /api/\<name\>
name is a string here

Returns activity for a given name. (Case sensitive)

An array populated with objects:
- id: number | the id of the current element (unique in /api/history)
- camid: number | the id of the camera that was leased (unique in /api/cams)
- starttime: number | The time at which the cameras lease was started given in epoch time (seconds)
- end: number | The time at which the cameras lease was ended given in epoch time (seconds)
- name: string | The name of the person that is responsible for this entry (always the same as name in the parameter)

### /api/\<camid\>
camid is an inter

Returns activity for a given camera.

An array populated with objects:
- id: number | the id of the current element (unique in /api/history)
- camid: number | the id of the camera that was leased (unique in /api/cams) (always the same as the camid in the parameter)
- starttime: number | The time at which the cameras lease was started given in epoch time (seconds)
- end: number | The time at which the cameras lease was ended given in epoch time (seconds)
- name: string | The name of the person that is responsible for this entry

### /api/date
Returns all dates with any activity

Returns an array with dates as strings. These are all formatted with YYYY-MM-DD

### /api/date/\<date\>
date should be a date given as a string in the format YYYY-MM-DD

Gives all activity for a certain date

An array populated with objects:
- id: number | the id of the current element (unique in /api/history)
- camid: number | the id of the camera that was leased (unique in /api/cams)
- starttime: number | The time at which the cameras lease was started given in epoch time (seconds)
- end: number | The time at which the cameras lease was ended given in epoch time (seconds)
- name: string | The name of the person that is responsible for this entry

### /\<path\>
Matches any other path. used to host index.html etc.
links to Cameralease/web/build/path

## POST

### /api/reserve
Reserves a camera for a given time. 

#### Expected input
A single Json object in the form:
- start: number | Time at wich the cameras lease should begin(seconds)
- end: number | Time at wich the cameras lease should end(seconds)
- uid: number | The id of the camera to be leased
- user: string | name of the person that is reserving

#### Response
Failure: Returns a 400 with text/plain explaining the error on a bad request. 
Success: Returns a 202 with application/json with the updated camera in the form
- name: string | The name of the camera
- model: string | The model of the camera
- uid: number | id of the current camera (unique)
- reservations: Array | future reservations of the current camera. All elements are an object:
    - start: number | The time at which the cameralease will start given in epoch time (seconds)
    - end: number | The time at which the cameralease will end given in epoch time (seconds)
    - user: string | The name of the person who reserved
- starttime number | (Optional exists iff starttime is defined): The time at which this cameras lease was started (Only included if the camera is currently beingn leased)
- user string | (Optional exists iff starttime is defined): The user that is currently inn posession of the camera

### /api/reserve/cancel
Cancels a reservation

#### Expected input
A single Json object in the form:
- start: number | Time at wich the cameras lease should begin given in epoch time (seconds)
- end: number | Time at wich the cameras lease should end given in epoch time (seconds)
- uid: number | The id of the camera to be leased
- user: string | name of the person that is reserving

This needs to be an exact match to the reservation that is the targeted for deletion

#### Response
Failure: Returns a 400 with text/plain explaining the error on a bad request. 
Success: Returns a 202 with null with the updated camera in the form

### /api/lease
Leases the camera

Starts a lease if end isn't given. Returns a 409 if already leased.
It always writes it to a DB if end is given.

Returns a 202 on a Success 
Returns a 404 if the input doesn't match the Expected input (see below)
Returns a 400 on any input discrepancies.

This function sets starttime and user for /api/cams

### Expected input
- start: number | Time at wich the cameras lease should begin (seconds)
- end (Optional): number | Time at wich the cameras lease should end (seconds). It starts a lease if not specified
- uid: number | The id of the camera to be leased
- user: string | name of the person that is leasing
