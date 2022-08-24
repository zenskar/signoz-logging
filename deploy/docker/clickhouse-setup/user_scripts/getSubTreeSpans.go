package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
)

type span struct {
	SpanId       []string `json:"spanID"`
	ParentSpanId []string `json:"parentSpanID"`
}

func main() {
	var span span
	err := json.NewDecoder(os.Stdin).Decode(&span)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("{\"spans\": [\"1\", \"2\"] }")
}
