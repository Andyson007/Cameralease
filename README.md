# Equipmentlease

Program that manages the equipment leases for my school

Check out /web and /server for info about running the program

<details>
<summary>Running the program</summary>

1. Build the frontend
    1. Use yarn or npm. make sure all packages are up to date by running 
      ```npm install```
      or
      ```yarn install```.
    2. Run
      ```yarn build``` or 
      ```npm run build```to build the project.
2. Build the server
    1. Run the rust server using ```cargo run``` in ```/server```.
3. Open [localhost:8000](http://localhost:8000) in your web browser.
</details>

<details>
<summary>Using the app</summary>

- Open [localhost:8000](http://localhost:8000) in your web browser.
- The main page lists out all existing equipment. Click on these to reserve or lease them.
  - When reserving, it is important to fill the *Name* and *until time* feilds.
- The History tab shows when and who had the camera at one specific time.

</details>