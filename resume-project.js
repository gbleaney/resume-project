Points = new Mongo.Collection("points");


if (Meteor.isClient) {
  Meteor.subscribe("points");

  Template.body.helpers({
    points: function() {
      return Points.find({});
    },
    pointsInSection: function(section){
      return Points.find({section: section});
    },
    items: function(){
      //Return array of distinct items
      return _.uniq(Points.find({},{
        sort: {itemID: 1}, fields: {itemID: true}
      }).fetch().map(function(x){
        return x.itemID;
      }), true);
    },
    userEmail: function(){
      return Meteor.user().emails[0].address;
    }
  });
  Template.body.events({
  "submit .new-point": function (event) {
    // This function is called when the new task form is submitted
    insertPoint(event);
    // Prevent default form submit
    return false;
  },
  "submit .new-skills": function (event) {
    // This function is called when the new task form is submitted
    insertPoint(event,"skills");
    // Prevent default form submit
    return false;
  },
  "submit .new-education": function (event) {
    // This function is called when the new task form is submitted
    insertPoint(event,"education");
    // Prevent default form submit
    return false;
  },
  "submit .new-item": function(event) {
    insertNewItem(event.target.text.value);
  },
  "submit .edit-point": function(event){
    var text = event.target.text.value;
    if(text === ""){
      Meteor.call("deletePoint", this._id);
    } else {
      Meteor.call("editPointText", this._id, text);
    }
  },
  "submit .edit-item": function(event){
    // TODO: Find a better way to get old text
    // Maybe pass the id of some point
    Meteor.call("editItemText",
      event.target.text.value,
      event.target.parentNode.parentNode.id);
  },
  "click .delete-point": function () {
    Meteor.call("deletePoint", this._id);
  },
  "submit .new-tag": function(event){
    var text = event.target.text.value;
    var id = event.target.parentNode.id;
    console.log(id);
    Meteor.call("addTag", text, id);
  },
  "click .delete-tag": function(event){
    Meteor.call("deleteTag",
      event.target.parentNode.childNodes[1].nodeValue,
      event.target.parentNode.parentNode.parentNode.id);
  }
});
Template.item.helpers({
  pointsInItemID: function(id){
    return Points.find({itemID: id});
  },
  idToItem: function(id){
    return idToItem(id);
  }
});
  function insertPoint(event, section){
      //Wrapper function for inserting new points under a section
      var text = event.target.text.value;
      var itemID = event.target.parentNode.parentNode.id;
      var item = idToItem(itemID);
      

      Meteor.call("addPoint", {text: text, 
                            section: section,
                               item: item,
                             itemID: itemID});

      // Clear form
      event.target.text.value = "";
  }
  function insertNewItem(itemName){
    var d = new Date();
    Meteor.call("addPoint",{text: "placeholder",
                            item: itemName,
                            itemID: itemName + d.getTime()});
  }
  function idToItem(id){
    var points = Points.findOne({itemID: id});
    return points.item;
  }
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

  Meteor.publish("points", function () {
    return Points.find({owner: this.userId});
  });
}

Meteor.methods({
  addPoint: function (data) {
    // Make sure the user is logged in before inserting a task
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Points.insert({
      point: data.text,
      item: data.item,
      itemID: data.itemID,
      tags: [],
      section: data.section,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },
  deletePoint: function (pointId) {
    var point = Points.findOne(pointId);
    if (point.owner !== Meteor.userId()) {
      // Make sure only the owner can delete it
      throw new Meteor.Error("not-authorized");
    }

    Points.remove(pointId);
  },
  editPointText: function(pointId,newText){
    //Update
    var point = Points.findOne(pointId);

    if (point.owner !== Meteor.userId()) {
      // Make sure only the owner can delete it
      throw new Meteor.Error("not-authorized");
    }
    Points.update({"_id": pointId},
      {$set:{"point": newText}});
  },
  editItemText: function(newItemName,itemID){
    var d = new Date();
    Points.update({itemID: itemID},
      {$set:{item: newItemName,
             itemID: newItemName + d.getTime()}},
      {multi: true});
  },
  addTag: function(tag, id){
    Points.update({_id: id},
      {$addToSet:{tags: tag}});
  },
  deleteTag: function(tag, id){
    Points.update({_id: id},
      {$pull:{tags: tag}});
  }
});
