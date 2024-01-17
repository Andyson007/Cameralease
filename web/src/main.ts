const cameralist = document.getElementById("cameralist");
if (!cameralist) console.error("cameralist does not exist");

function createCard (name: string, uid: string) {
  if (!cameralist) return;

  // Card element
  let base = document.createElement("div");
  base.classList.add("cameracard", "available");
  base.setAttribute("uid", uid); // For border color availability

  // name, model and image?
  let notdropdown = document.createElement("div");
  notdropdown.classList.add("notdropdown");

  // Image?
  let left = document.createElement("div");
  left.classList.add("camcardleft");

  // name, model
  let right = document.createElement("div");
  right.classList.add("camcardright")

  // Name
  let nameplate = document.createElement("span");
  nameplate.classList.add("nameplate");
  nameplate.innerText = name;

  // Model
  let idtext = document.createElement("span");
  idtext.classList.add("idtext");
  idtext.innerText = uid;

  // Hidden until revealed
  let dropdown = document.createElement("div");
  dropdown.classList.add("dropdown");

  base.addEventListener("click", async () => {
    console.log("lol no")
    let resp = await fetch("/api/ping", {method: "POST", body: "foo"});
    console.log(resp.ok);
    console.log(resp.status);
  });

  right.appendChild(nameplate);
  right.appendChild(idtext);
  
  notdropdown.appendChild(left);
  notdropdown.appendChild(right);

  base.appendChild(notdropdown);
  base.appendChild(dropdown);
  cameralist.appendChild(base);
}

createCard("camera model or something", "CSX 8888");