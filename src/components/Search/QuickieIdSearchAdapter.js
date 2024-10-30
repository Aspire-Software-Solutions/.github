import React from "react";
import SearchInput from "./SearchInput";
import { toast } from "react-toastify";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import SearchResultQuickies from "./SearchResultQuickies";

const QuickieIDSearchAdapter = () => {
  const db = getFirestore();

  const handleQuickieIDSearch = async (quickieId, setSearchQuickieData, setSearchQuickieLoading) => {
    if (!quickieId) {
      return toast.error("Enter a Quickie ID to search");
    }

    try {
      setSearchQuickieLoading(true);

      const quickieDoc = doc(db, "quickies", quickieId);
      const quickieSnapshot = await getDoc(quickieDoc);

      if (quickieSnapshot.exists()) {
        setSearchQuickieData([{ id: quickieId, ...quickieSnapshot.data() }]);
      } else {
        setSearchQuickieData([]);
        toast.error("No quickie found with that ID.");
      }
    } catch (err) {
      console.error("Quickie ID search error:", err);
      toast.error("Failed to fetch Quickie data.");
    } finally {
      setSearchQuickieLoading(false);
    }
  };

  return (
    <SearchInput
      placeholder="Search for a Quickie by ID"
      onSearch={handleQuickieIDSearch}
      SearchResultComponent={SearchResultQuickies}
    />
  );
};

export default QuickieIDSearchAdapter;
