function openDBConnection() {
    console.log("openDBConnection");
    window.indexedDB = window.webkitIndexedDB;
    
    if (!window.indexedDB) {
        console.log("indexedDB not supported");
    } else {
        var request = window.indexedDB.open("projectsDB", 6);
        
        request.onerror = function(evt) {
            console.log(evt.target.message);
        };
        
        request.onupgradeneeded = function(evt) {
            console.log("on upgrade needed");
            
            global.db = evt.target.result;
            
            if (global.db.objectStoreNames.contains("projectsStore")) {
                global.db.deleteObjectStore("projectsStore");
            }
            
            var objStore = global.db.createObjectStore("projectsStore", { keyPath: "id", autoIncrement: true });
        };
        
        request.onsuccess = function(evt) {
            console.log("projects database opened successfully");
            global.db = evt.target.result;            
            getProjects();    
        };
    }
}

function closeDBConnection() {
    console.log("closeDBConnection");
    global.db.close();
}

function removeProjectById(id) {
    console.log("removeProjectById - id: " + id);
    var request = global.db.transaction(["projectsStore"], "readwrite").objectStore("projectsStore").delete(+id);
    
    request.onsuccess = function(evt) {
        global.db.transaction(["projectsStore"], "readwrite").objectStore("projectsStore").count().onsuccess = function(evt) {
            var count = evt.target.result;
            console.log("number of projects after removal: " + count);  
            global.jQuery("#removeProjectOverlay").hide();      
        };        
    };
    
    request.onerror = function(evt) {
        console.log(evt.message);
    };
}

function addProject(projectName, projectVersion, iconPath) {
    console.log("addProject called");

    var projectObj = {"name":projectName, "version":projectVersion, "iconPath":iconPath};

    console.log("projectObj:" + JSON.stringify(projectObj));
   
    // insert into database
    // TODO: should we add error checking to make sure the same project isn't added to the db twice?    
    var request = global.db.transaction(["projectsStore"], "readwrite").objectStore("projectsStore").put(projectObj);

    request.onsuccess = function(evt) {
        console.log("addProject success");
        getProjectCount();
    };

    request.onerror = function(evt) {
        console.log(evt.message);
    };   
}

function getProjectCount() {
    global.db.transaction(["projectsStore"], "readwrite").objectStore("projectsStore").count().onsuccess = function(evt) {
        var count = evt.target.result;
        console.log("getProjectCount: " + count);
        getProjectByIndex(count);        
    };      
}

function getProjectByIndex(projectCount) {
    // uses projectCount to get the last record added to the db, then retrieve the Id of the last record added before attaching a project widget to the GUI
    console.log("getProjectByIndex - projectCount: " + projectCount);

    var keyRange = IDBKeyRange.lowerBound(0);
    var cursorRequest = global.db.transaction(["projectsStore"], "readwrite").objectStore("projectsStore").openCursor(keyRange);
    var count = 0;
    
    cursorRequest.onsuccess = function(evt) {
        var result = evt.target.result;
        
        count += 1;
        var row = result.value;
   
        if (count == projectCount) {
            addProjectWidget(row.id, row.name, row.version, row.iconPath);
            return;
        }

        result.continue();
    };
    
    cursorRequest.onerror = function(evt) {
        console.log(evt.message);
    };
}

function getProjects() {
    var keyRange = IDBKeyRange.lowerBound(0);
    var cursorRequest = global.db.transaction(["projectsStore"], "readwrite").objectStore("projectsStore").openCursor(keyRange);
    var count = 0;
    
    cursorRequest.onsuccess = function(evt) {
        var result = evt.target.result;
        if (!!result == false) {
            console.log(count + " projects successfully retrieved");
            return;
        }
        
        count += 1;
        var row = result.value;
        addProjectWidget(row.id, row.name, row.version, row.iconPath);
        result.continue();
    };
    
    cursorRequest.onerror = function(evt) {
        console.log(evt.message);
    };
}
